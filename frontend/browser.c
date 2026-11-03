#define _GNU_SOURCE
#include <gtk/gtk.h>
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#define JSMN_STATIC
#include "vendor/jsmn.h"

/* GTK2 presents frames produced by a Chromium child on this same device.
 * There is no network listener or remote rendering service. */
typedef struct {
    GtkWidget *window, *image, *viewport, *address, *status;
    GtkWidget *keyboard_panel, *keyboard_entry, *keyboard_rows, *ua_button;
    GtkWidget *keyboard_target, *more_menu, *settings_dialog, *settings_notice;
    GtkWidget *content, *panel, *toolbar, *bar_separator;
    gboolean full_page, keyboard_manual, keyboard_suppressed, web_editing, landscape;
    int ui_scale, page_scale, orientation, full_orientation;
    char *full_url, *orientation_helper, *restore_orientation;
    guint focus_timer, hold_timer;
    GPtrArray *favorites, *visits;
    GKeyFile *preferences;
    char *assets, *prefs_path, *favorites_path, *visits_path, *homepage, *last_url, *last_title;
    int search_engine, title_id, cookies_id;
    double press_x, press_y;
    gboolean pressed;
    GdkPixbuf *frame;
    gboolean keyboard_address, uppercase, symbols, loading;
    int ua, ua_id, ua_next, focus_id;
    char *main_frame;
    gboolean initial_navigation;
    char *ua_path;
    GIOChannel *reader, *writer;
    GByteArray *incoming, *outgoing;
    guint read_watch, write_watch, resize_timer, frame_timer, child_watch;
    pid_t child;
    GPid refresh_pid;
    int read_fd, write_fd, next_id;
    int targets_id, create_id, attach_id, capture_id, history_id, history_step;
    int width, height, metrics_id;
    gboolean resize_dirty;
    gint64 capture_started;
    gboolean alive, page_loaded;
    char *session, *initial_url;
} Browser;
static Browser app;
static void keyboard(GtkWidget *widget, gpointer address_mode);
static void rebuild_keys(void);
static void reload_page(GtkWidget *widget, gpointer unused);
static void apply_user_agent(gboolean initial);
static void navigate(const char *url);
static void show_settings(GtkWidget *,gpointer);
static void show_favorites(GtkWidget *,gpointer);
static void show_history(GtkWidget *,gpointer);
static char *resolve_input(const char *,int);
static char *page_url(const char *);
static char *visible_url(const char *);
static void record_visit(const char *,const char *);
static void save_preferences(void);
static void toggle_keyboard(GtkWidget *,gpointer);
static void home(GtkWidget *,gpointer);
static void hide_keyboard(GtkWidget *,gpointer);
static void panel_close(GtkWidget *,gpointer);
static void apply_ui_scale(void);
static void touch_size(GtkWidget *,int,int);
static void touch_font(GtkWidget *,int);
static void update_icon(GtkWidget *,int);
static void orientation_apply(void);
static const char *orientation_code(int);
static volatile sig_atomic_t stopping;
static void stop_signal(int signum) { (void)signum; stopping=1; }
#ifdef BROWSER_TEST
static const char *test_screenshot;
static int test_result=1;
static gboolean save_test_window(gpointer unused) {
    (void)unused;
    GdkWindow *window=gtk_widget_get_window(app.window);
    int width,height;
    gdk_drawable_get_size(window,&width,&height);
    GdkPixbuf *image=gdk_pixbuf_get_from_drawable(NULL,window,NULL,0,0,0,0,width,height);
    GError *error=NULL;
    if (image && gdk_pixbuf_save(image,test_screenshot,"png",&error,NULL)) test_result=0;
    if (error) { fprintf(stderr,"Screenshot: %s\n",error->message); g_error_free(error); }
    if (image) g_object_unref(image);
    gtk_main_quit();
    return FALSE;
}
static gboolean test_timeout(gpointer unused) {
    (void)unused;
    gtk_main_quit(); return FALSE;
}
#endif

static void notice(const char *text) {
    if (app.status && !app.full_page) {
        gtk_label_set_text(GTK_LABEL(app.status), text);
        if (!strcmp(text,"Ready")) gtk_widget_hide(app.status); else gtk_widget_show(app.status);
    }
    fprintf(stderr, "%s\n", text);
}

static int skip_token(const jsmntok_t *t, int n, int i) {
    int end = t[i].end;
    for (++i; i < n && t[i].start < end; ++i) {}
    return i;
}
static gboolean token_is(const char *s, const jsmntok_t *t, const char *value) {
    return t->type == JSMN_STRING && (int)strlen(value) == t->end-t->start &&
           !memcmp(s+t->start, value, strlen(value));
}
static int member(const char *s, const jsmntok_t *t, int n, int obj, const char *key) {
    if (obj < 0 || obj >= n || t[obj].type != JSMN_OBJECT) return -1;
    for (int i=obj+1; i+1 < n && t[i].start < t[obj].end;) {
        int value=i+1;
        if (token_is(s, t+i, key)) return value;
        i=skip_token(t,n,value);
    }
    return -1;
}
static int number(const char *s, const jsmntok_t *t, int i) {
    if (i < 0 || t[i].type != JSMN_PRIMITIVE || t[i].end-t[i].start > 10) return 0;
    char *v=g_strndup(s+t[i].start,t[i].end-t[i].start);
    char *end=NULL;
    gint64 result=g_ascii_strtoll(v,&end,10);
    gboolean valid=end && !*end && result >= G_MININT && result <= G_MAXINT;
    g_free(v);
    return valid ? (int)result : 0;
}
static gboolean hex4(const char *p, gunichar *value) {
    *value=0;
    for (int i=0;i<4;++i) {
        int h=g_ascii_xdigit_value(p[i]);
        if (h < 0) return FALSE;
        *value=(*value<<4) | (unsigned)h;
    }
    return TRUE;
}
static char *string_value(const char *s, const jsmntok_t *t, int i) {
    if (i < 0 || t[i].type != JSMN_STRING) return NULL;
    GString *out=g_string_new(NULL);
    for (int p=t[i].start;p<t[i].end;++p) {
        char c=s[p];
        if (c!='\\') { g_string_append_c(out,c); continue; }
        if (++p >= t[i].end) goto bad;
        switch (s[p]) {
        case '"': case '\\': case '/': g_string_append_c(out,s[p]); break;
        case 'b': g_string_append_c(out,'\b'); break;
        case 'f': g_string_append_c(out,'\f'); break;
        case 'n': g_string_append_c(out,'\n'); break;
        case 'r': g_string_append_c(out,'\r'); break;
        case 't': g_string_append_c(out,'\t'); break;
        case 'u': {
            gunichar code;
            if (p+4 >= t[i].end || !hex4(s+p+1,&code)) goto bad;
            p+=4;
            if (code>=0xd800 && code<=0xdbff) {
                gunichar low;
                if (p+6 >= t[i].end || s[p+1]!='\\' || s[p+2]!='u' ||
                    !hex4(s+p+3,&low) || low<0xdc00 || low>0xdfff) goto bad;
                code=0x10000+((code-0xd800)<<10)+(low-0xdc00);
                p+=6;
            }
            if (!code || (code>=0xdc00 && code<=0xdfff)) goto bad;
            char utf8[6];
            int len=g_unichar_to_utf8(code,utf8);
            g_string_append_len(out,utf8,len);
            break;
        }
        default: goto bad;
        }
    }
    if (!g_utf8_validate(out->str,out->len,NULL)) goto bad;
    return g_string_free(out,FALSE);
bad:
    g_string_free(out,TRUE);
    return NULL;
}
static char *quote(const char *text) {
    GString *s=g_string_new("\"");
    for (const unsigned char *p=(const unsigned char *)text; *p; ++p) {
        if (*p=='"' || *p=='\\') { g_string_append_c(s,'\\'); g_string_append_c(s,*p); }
        else if (*p<32) g_string_append_printf(s,"\\u%04x",*p);
        else g_string_append_c(s,*p);
    }
    g_string_append_c(s,'"');
    return g_string_free(s,FALSE);
}

static gboolean flush_commands(GIOChannel *channel, GIOCondition condition, gpointer unused) {
    (void)channel; (void)unused;
    if (condition & (G_IO_ERR|G_IO_HUP|G_IO_NVAL)) goto closed;
    while (app.outgoing->len) {
        ssize_t n=write(app.write_fd,app.outgoing->data,app.outgoing->len);
        if (n<0 && errno==EINTR) continue;
        if (n<0 && (errno==EAGAIN || errno==EWOULDBLOCK)) return TRUE;
        if (n<=0) goto closed;
        g_byte_array_remove_range(app.outgoing,0,(guint)n);
    }
    app.write_watch=0;
    return FALSE;
closed:
    app.write_watch=0;
    app.alive=FALSE;
    notice("The browser engine disconnected.");
    return FALSE;
}
static int command(const char *method, const char *params, gboolean session) {
    if (!app.alive || (session && !app.session)) return 0;
    if (app.outgoing->len > 256*1024) { notice("The browser engine is not responding."); return 0; }
    int id=++app.next_id;
#ifdef BROWSER_TEST
    fprintf(stderr,"CDP send %d %s\n",id,method);
#endif
    char *m=quote(method), *sid=app.session ? quote(app.session) : NULL;
    char *request=g_strdup_printf("{\"id\":%d,\"method\":%s,\"params\":%s%s%s}",
        id,m,params ? params : "{}",session ? ",\"sessionId\":" : "",session ? sid : "");
    g_byte_array_append(app.outgoing,(const guint8 *)request,strlen(request)+1);
    g_free(m); g_free(sid); g_free(request);
    if (!app.write_watch) app.write_watch=g_io_add_watch(app.writer,
        G_IO_OUT|G_IO_ERR|G_IO_HUP|G_IO_NVAL,flush_commands,NULL);
    return id;
}
static void loading(gboolean active) {
    app.loading=active;if(active){app.page_loaded=FALSE;app.capture_id=0;}
    notice(active ? "Loading…" : "Ready");
}
static void navigate(const char *input) {
    char *url=page_url(input);
    if (!url) {notice("This address is not supported.");return;}
    if(app.panel)panel_close(NULL,NULL);
    hide_keyboard(NULL,NULL);app.keyboard_target=NULL;app.keyboard_manual=FALSE;app.web_editing=FALSE;app.keyboard_suppressed=FALSE;
    app.page_loaded=FALSE;
    char *quoted=quote(url);
    char *params=g_strdup_printf("{\"url\":%s}",quoted);
    command("Page.navigate",params,TRUE);
    loading(TRUE);
    g_free(params);g_free(quoted);g_free(url);
}
static gboolean dimensions(gpointer unused) {
    (void)unused;
    app.resize_timer=0;
    double scale=app.page_scale/100.0;char scale_text[G_ASCII_DTOSTR_BUF_SIZE];g_ascii_dtostr(scale_text,sizeof(scale_text),scale);
    char *p=g_strdup_printf("{\"width\":%d,\"height\":%d,\"deviceScaleFactor\":%s,\"mobile\":false}",MAX(1,(int)(app.width/scale)),MAX(1,(int)(app.height/scale)),scale_text);
    app.capture_id=0;app.resize_dirty=TRUE;app.metrics_id=command("Emulation.setDeviceMetricsOverride",p,TRUE);
    char *visible=g_strdup_printf("{\"width\":%d,\"height\":%d}",MAX(1,(int)(app.width/scale)),MAX(1,(int)(app.height/scale)));command("Emulation.setVisibleSize",visible,TRUE);g_free(visible);
    g_free(p);
    return FALSE;
}
static gboolean capture(gpointer unused) {
    (void)unused;
    if (stopping) { gtk_main_quit(); return TRUE; }
    if(app.capture_id && g_get_monotonic_time()-app.capture_started>5000000){fprintf(stderr,"Recovering a stale page capture\n");app.capture_id=0;}
    if (app.session && app.alive && app.page_loaded && !app.capture_id && !app.metrics_id)
        {app.capture_started=g_get_monotonic_time();app.capture_id=command("Page.captureScreenshot",
            "{\"format\":\"png\",\"fromSurface\":true,\"captureBeyondViewport\":false}",TRUE);}
    return TRUE;
}
static void show_frame(const char *encoded) {
    gsize length=0;
    guchar *bytes=g_base64_decode(encoded,&length);
    GdkPixbufLoader *loader=gdk_pixbuf_loader_new_with_type("png",NULL);
    GError *error=NULL;
    if (!loader) { g_free(bytes); notice("Cannot decode the page image."); return; }
    gboolean ok=gdk_pixbuf_loader_write(loader,bytes,length,&error);
    if (ok) ok=gdk_pixbuf_loader_close(loader,&error);
    else gdk_pixbuf_loader_close(loader,NULL);
    if (ok) {
        GdkPixbuf *pixbuf=gdk_pixbuf_loader_get_pixbuf(loader);
        if (pixbuf) {
            if (app.frame) g_object_unref(app.frame);
            app.frame=g_object_ref(pixbuf);
            gtk_widget_queue_draw(app.image);
#ifdef BROWSER_TEST
            if (test_screenshot && app.page_loaded) g_timeout_add(500,save_test_window,NULL);
#endif
        }
    } else {
        notice("Cannot display this page.");
        if (error) { fprintf(stderr,"PNG: %s\n",error->message); g_error_free(error); }
    }
    g_object_unref(loader); g_free(bytes);
}
static void attach(const char *target) {
    char *q=quote(target), *p=g_strdup_printf("{\"targetId\":%s,\"flatten\":true}",q);
    app.attach_id=command("Target.attachToTarget",p,FALSE);
    g_free(q); g_free(p);
}
static void message(const char *json, size_t length) {
    jsmn_parser parser; jsmntok_t tokens[4096];
    jsmn_init(&parser);
    int n=jsmn_parse(&parser,json,length,tokens,G_N_ELEMENTS(tokens));
    if (n<1 || tokens[0].type!=JSMN_OBJECT) { notice("Unrecognized engine response."); return; }
    int id=number(json,tokens,member(json,tokens,n,0,"id"));
    int result=member(json,tokens,n,0,"result");
#ifdef BROWSER_TEST
    if (id) fprintf(stderr,"CDP reply %d (%zu bytes)\n",id,length);
    if (g_getenv("GTK_UI_TEST_LOG") && length<8192 && !g_strstr_len(json,length,"\"data\":")) fprintf(stderr,"CDP JSON %.*s\n",(int)length,json);
#endif
    int error=member(json,tokens,n,0,"error");
    if (error>=0) {
        char *detail=string_value(json,tokens,member(json,tokens,n,error,"message"));
        fprintf(stderr,"Chromium command %d: %s\n",id,detail ? detail : "unknown error");
        g_free(detail);
        if (id==app.capture_id) app.capture_id=0;
        if (id==app.focus_id) app.focus_id=0;
        if (id==app.metrics_id)app.metrics_id=0;
        if (id==app.history_id)app.history_id=0;
        if (id==app.ua_id) {
            app.ua_id=0;
            if (app.initial_navigation) navigate(app.initial_url);
        }
        notice("The engine could not complete this action.");
        return;
    }
    if (id && id==app.targets_id) {
        int list=member(json,tokens,n,result,"targetInfos");
        if (list>=0 && tokens[list].type==JSMN_ARRAY) {
            for (int i=list+1;i<n && tokens[i].start<tokens[list].end;i=skip_token(tokens,n,i)) {
                int type=member(json,tokens,n,i,"type");
                if (type>=0 && token_is(json,tokens+type,"page")) {
                    char *target=string_value(json,tokens,member(json,tokens,n,i,"targetId"));
                    if (target) { attach(target); g_free(target); return; }
                }
            }
        }
        app.create_id=command("Target.createTarget","{\"url\":\"about:blank\"}",FALSE);
    } else if (id && id==app.create_id) {
        char *target=string_value(json,tokens,member(json,tokens,n,result,"targetId"));
        if (target) { attach(target); g_free(target); }
    } else if (id && id==app.attach_id) {
        app.session=string_value(json,tokens,member(json,tokens,n,result,"sessionId"));
        if (!app.session) { notice("Cannot open the page."); return; }
        command("Page.enable","{}",TRUE);
        command("Runtime.enable","{}",TRUE);
        command("Runtime.addBinding","{\"name\":\"khromiumNavigate\"}",TRUE);
        dimensions(NULL);
        apply_user_agent(TRUE);
    } else if(id && id==app.metrics_id){
        app.metrics_id=0;capture(NULL);
    } else if (id && id==app.cookies_id) {
        app.cookies_id=0;notice("Cookies deleted.");
        if(app.settings_notice)gtk_label_set_text(GTK_LABEL(app.settings_notice),"Cookies deleted. Websites may sign you out.");
    } else if (id && id==app.title_id) {
        int remote=member(json,tokens,n,result,"result");
        char *title=string_value(json,tokens,member(json,tokens,n,remote,"value"));
        if(title && *title) {g_free(app.last_title);app.last_title=title;record_visit(app.last_url,title);}
        else g_free(title);
    } else if (id && id==app.focus_id) {
        app.focus_id=0;
        int remote=member(json,tokens,n,result,"result");
        int value=member(json,tokens,n,remote,"value");
        gboolean active=value>=0 && tokens[value].type==JSMN_PRIMITIVE && tokens[value].end-tokens[value].start==4 && !strncmp(json+tokens[value].start,"true",4);
        gboolean changed=active!=app.web_editing;app.web_editing=active;
        if(changed)app.keyboard_suppressed=FALSE;
        if(!app.panel && !app.keyboard_target){
            if(active && !app.keyboard_suppressed && !GTK_WIDGET_VISIBLE(app.keyboard_panel))keyboard(NULL,NULL);
            if(!active && (changed || !app.keyboard_manual))hide_keyboard(NULL,NULL);
        }
    } else if (id && id==app.ua_id) {
        app.ua_id=0;
        app.ua=app.ua_next;
        
        save_preferences();
        if (app.initial_navigation) navigate(app.initial_url);
        else reload_page(NULL,NULL);
    } else if (id && id==app.capture_id) {
        app.capture_id=0;
        char *data=string_value(json,tokens,member(json,tokens,n,result,"data"));
        if (data) { show_frame(data); g_free(data); }
        if(app.resize_dirty && !app.metrics_id){app.resize_dirty=FALSE;capture(NULL);}
    } else if (id && id==app.history_id) {
        int current=number(json,tokens,member(json,tokens,n,result,"currentIndex"));
        int list=member(json,tokens,n,result,"entries"), index=0;
        if (list>=0 && tokens[list].type==JSMN_ARRAY) {
            for (int i=list+1;i<n && tokens[i].start<tokens[list].end;i=skip_token(tokens,n,i),++index) {
                if (index==current+app.history_step) {
                    int entry=number(json,tokens,member(json,tokens,n,i,"id"));
                    char *p=g_strdup_printf("{\"entryId\":%d}",entry);
                    loading(TRUE);command("Page.navigateToHistoryEntry",p,TRUE); g_free(p); break;
                }
            }
        }
        app.history_id=0;
    }
    int method=member(json,tokens,n,0,"method");
    if(method>=0 && token_is(json,tokens+method,"Runtime.bindingCalled") && app.last_url && !strcmp(app.last_url,"khromium://home")) {
        int params=member(json,tokens,n,0,"params");char *name=string_value(json,tokens,member(json,tokens,n,params,"name"));char *payload=string_value(json,tokens,member(json,tokens,n,params,"payload"));
        if(name && !strcmp(name,"khromiumNavigate") && payload){char *url=resolve_input(payload,0);if(url){navigate(url);g_free(url);}}
        g_free(name);g_free(payload);
    }
    if (method>=0 && token_is(json,tokens+method,"Page.frameStartedLoading")) {
        int params=member(json,tokens,n,0,"params");
        char *frame=string_value(json,tokens,member(json,tokens,n,params,"frameId"));
        if (!app.main_frame || (frame && !strcmp(frame,app.main_frame))) loading(TRUE);
        g_free(frame);
    }
    if (method>=0 && token_is(json,tokens+method,"Page.frameStoppedLoading")) {
        int params=member(json,tokens,n,0,"params");
        char *frame=string_value(json,tokens,member(json,tokens,n,params,"frameId"));
        if (app.main_frame && frame && !strcmp(frame,app.main_frame)) {
            app.page_loaded=TRUE; loading(FALSE);
        }
        g_free(frame);
    }
    if (method>=0 && token_is(json,tokens+method,"Page.loadEventFired")) {
        app.capture_id=0;app.page_loaded=TRUE; loading(FALSE);capture(NULL);
        app.title_id=command("Runtime.evaluate","{\"expression\":\"document.title\",\"returnByValue\":true}",TRUE);
    }
    if (method>=0 && token_is(json,tokens+method,"Page.frameNavigated")) {
        int params=member(json,tokens,n,0,"params");
        int frame=member(json,tokens,n,params,"frame");
        if (member(json,tokens,n,frame,"parentId")<0) {
            g_free(app.main_frame);
            app.main_frame=string_value(json,tokens,member(json,tokens,n,frame,"id"));
            char *url=string_value(json,tokens,member(json,tokens,n,frame,"url"));
            if (url) {
                char *display=visible_url(url);
                g_free(app.last_url);app.last_url=g_strdup(display);
                g_free(app.last_title);app.last_title=g_strdup(display);
                gtk_entry_set_text(GTK_ENTRY(app.address),display);
                record_visit(display,display);g_free(display);g_free(url);
            }
        }
    }
}
static gboolean read_messages(GIOChannel *channel, GIOCondition condition, gpointer unused) {
    (void)channel; (void)unused;
    guint8 buffer[16384];
    for (;;) {
        ssize_t length=read(app.read_fd,buffer,sizeof(buffer));
        if (length<0 && errno==EINTR) continue;
        if (length<0 && (errno==EAGAIN || errno==EWOULDBLOCK)) break;
        if (length<=0) goto closed;
        if (app.incoming->len+(guint)length > 24*1024*1024) {
            notice("The page image is too large."); goto closed;
        }
        g_byte_array_append(app.incoming,buffer,(guint)length);
        guint consumed=0;
        for (;;) {
            guint8 *end=memchr(app.incoming->data+consumed,0,app.incoming->len-consumed);
            if (!end) break;
            guint size=(guint)(end-(app.incoming->data+consumed));
            if (size) message((const char *)app.incoming->data+consumed,size);
            consumed+=size+1;
        }
        if (consumed) g_byte_array_remove_range(app.incoming,0,consumed);
    }
    if (!(condition & (G_IO_HUP|G_IO_ERR|G_IO_NVAL))) return TRUE;
closed:
    app.alive=FALSE; app.read_watch=0;
    notice("The engine stopped. See state/run.log.");
    return FALSE;
}
static void child_exited(GPid pid, gint status, gpointer unused) {
    (void)unused;
    app.child_watch=0; app.child=0; app.alive=FALSE;
    fprintf(stderr,"Chromium exited: %d\n",status);
    g_spawn_close_pid(pid);
    notice("The engine stopped. See state/run.log.");
}
static gboolean launch_engine(const char *engine, const char *profile, gboolean unsafe) {
    int input[2], output[2];
    if (pipe2(input,O_CLOEXEC)<0) return FALSE;
    if (pipe2(output,O_CLOEXEC)<0) { close(input[0]); close(input[1]); return FALSE; }
    int source_in=fcntl(input[0],F_DUPFD_CLOEXEC,10);
    int source_out=fcntl(output[1],F_DUPFD_CLOEXEC,10);
    char *profile_arg=g_strdup_printf("--user-data-dir=%s",profile);
    pid_t child=(source_in<0 || source_out<0) ? -1 : fork();
    if (!child) {
        if (setpgid(0,0)<0) _exit(126);
        close(input[0]); close(input[1]); close(output[0]); close(output[1]);
        if (dup2(source_in,3)<0 || dup2(source_out,4)<0) _exit(126);
        close(source_in); close(source_out);
        const char *arguments[20]; int i=0;
        arguments[i++]=engine;
        arguments[i++]="--remote-debugging-pipe";
        arguments[i++]="--ozone-platform=headless";
        arguments[i++]="--window-size=1072,1300";
        arguments[i++]="--disable-gpu";
        arguments[i++]="--disable-software-rasterizer";
        arguments[i++]="--disable-dev-shm-usage";
        arguments[i++]="--renderer-process-limit=1";
        arguments[i++]="--disk-cache-size=8388608";
        arguments[i++]="--disable-background-networking";
        arguments[i++]="--disable-component-update";
        arguments[i++]="--no-first-run";
        arguments[i++]=profile_arg;
        if (unsafe) arguments[i++]="--no-sandbox";
        arguments[i++]="about:blank";
        arguments[i]=NULL;
        execv(engine,(char *const *)arguments);
        _exit(127);
    }
    if (source_in>=0) close(source_in);
    if (source_out>=0) close(source_out);
    close(input[0]); close(output[1]); g_free(profile_arg);
    if (child<0) { close(input[1]); close(output[0]); return FALSE; }
    app.child=child; app.write_fd=input[1]; app.read_fd=output[0]; app.alive=TRUE;
    fcntl(app.read_fd,F_SETFL,fcntl(app.read_fd,F_GETFL)|O_NONBLOCK);
    fcntl(app.write_fd,F_SETFL,fcntl(app.write_fd,F_GETFL)|O_NONBLOCK);
    app.reader=g_io_channel_unix_new(app.read_fd);
    app.writer=g_io_channel_unix_new(app.write_fd);
    g_io_channel_set_close_on_unref(app.reader,TRUE);
    g_io_channel_set_close_on_unref(app.writer,TRUE);
    app.read_watch=g_io_add_watch(app.reader,G_IO_IN|G_IO_ERR|G_IO_HUP|G_IO_NVAL,read_messages,NULL);
    app.child_watch=g_child_watch_add(child,child_exited,NULL);
    app.targets_id=command("Target.getTargets","{}",FALSE);
    return TRUE;
}

static void open_address(GtkWidget *widget, gpointer unused) {
    (void)widget; (void)unused;
    const char *text=gtk_entry_get_text(GTK_ENTRY(app.address));
    if (!*text) return;
    char *url=resolve_input(text,app.search_engine);
    if(url){navigate(url);g_free(url);}else notice("WWW opens an address directly. Enter a URL or select a search engine.");
}
static void history(GtkWidget *widget, gpointer step) {
    (void)widget;
    if(app.panel)panel_close(NULL,NULL);
    if (app.history_id) return;
    app.history_step=GPOINTER_TO_INT(step);
    app.history_id=command("Page.getNavigationHistory","{}",TRUE);
}
static void reload_page(GtkWidget *widget, gpointer unused) {
    (void)widget; (void)unused;if(app.panel)panel_close(NULL,NULL); loading(TRUE); command("Page.reload","{}",TRUE);
}
static void scroll_page(GtkWidget *widget, gpointer step) {
    (void)widget;
    char *p=g_strdup_printf("{\"type\":\"mouseWheel\",\"x\":%d,\"y\":%d,\"deltaX\":0,\"deltaY\":%d}",
        (int)(app.width*50.0/app.page_scale),(int)(app.height*50.0/app.page_scale),(int)(GPOINTER_TO_INT(step)*app.height*75.0/app.page_scale));
    command("Input.dispatchMouseEvent",p,TRUE); g_free(p);
}
static gboolean hold_exit(gpointer unused){(void)unused;app.hold_timer=0;gtk_main_quit();return FALSE;}
static gboolean page_motion(GtkWidget *widget,GdkEventMotion *event,gpointer unused){
    (void)widget;(void)unused;if(app.hold_timer && (abs((int)(event->x-app.press_x))>25 || abs((int)(event->y-app.press_y))>25)){g_source_remove(app.hold_timer);app.hold_timer=0;}return FALSE;
}
static void request_focus(void){
    const char *expression="(()=>{const e=document.activeElement;if(!e || e.disabled || e.readOnly)return false;if(e.isContentEditable || e.tagName==='TEXTAREA')return true;return e.tagName==='INPUT' && !/^(button|submit|reset|checkbox|radio|range|color|file|hidden)$/.test(e.type);})()";
    char *q=quote(expression),*p=g_strdup_printf("{\"expression\":%s,\"returnByValue\":true}",q);app.focus_id=command("Runtime.evaluate",p,TRUE);g_free(q);g_free(p);
}
static gboolean poll_focus(gpointer unused){
    (void)unused;if(app.session && app.page_loaded && !app.panel && !app.keyboard_target && !app.focus_id)request_focus();return TRUE;
}
static gboolean click_page(GtkWidget *widget,GdkEventButton *event,gpointer unused) {
    (void)widget;(void)unused;
    if(event->button!=1)return FALSE;
    if(event->type==GDK_BUTTON_PRESS){app.pressed=TRUE;app.press_x=event->x;app.press_y=event->y;if(app.full_page && event->x<60 && event->y<60)app.hold_timer=g_timeout_add(2000,hold_exit,NULL);return TRUE;}
    if(event->type!=GDK_BUTTON_RELEASE || !app.pressed)return FALSE;
    app.pressed=FALSE;if(app.hold_timer){g_source_remove(app.hold_timer);app.hold_timer=0;}
    int x=CLAMP((int)event->x,0,app.width-1),y=CLAMP((int)event->y,0,app.height-1);
    if(abs((int)(event->y-app.press_y))>45) {
        char *p=g_strdup_printf("{\"type\":\"mouseWheel\",\"x\":%d,\"y\":%d,\"deltaX\":0,\"deltaY\":%d}",(int)(x*100.0/app.page_scale),(int)(y*100.0/app.page_scale),(int)((app.press_y-event->y)*100.0/app.page_scale));
        command("Input.dispatchMouseEvent",p,TRUE);g_free(p);return TRUE;
    }
    const char *types[]={"mousePressed","mouseReleased"};
    for(guint i=0;i<2;++i){
        char *p=g_strdup_printf("{\"type\":\"%s\",\"x\":%d,\"y\":%d,\"button\":\"left\",\"clickCount\":1}",types[i],(int)(x*100.0/app.page_scale),(int)(y*100.0/app.page_scale));
        command("Input.dispatchMouseEvent",p,TRUE);g_free(p);
    }
    app.keyboard_target=NULL;app.keyboard_manual=FALSE;app.keyboard_suppressed=FALSE;
    request_focus();
    return TRUE;
}
static gboolean scroll_event(GtkWidget *w,GdkEventScroll *event,gpointer unused){
    (void)w;(void)unused;scroll_page(NULL,GINT_TO_POINTER(event->direction==GDK_SCROLL_UP ? -1:1));return TRUE;
}
static void resize_page(GtkWidget *widget, GtkAllocation *allocation, gpointer unused) {
    (void)widget; (void)unused;
    int width=CLAMP(allocation->width,320,1600), height=CLAMP(allocation->height,240,2000);
    if (width==app.width && height==app.height) return;
    app.width=width; app.height=height;
    if (app.resize_timer) g_source_remove(app.resize_timer);
    app.resize_timer=g_timeout_add(300,dimensions,NULL);
}
/* The keyboard is part of the main window, so its lower edge stays at the
 * bottom of the screen and page input retains Chromium's focused element. */
static void send_key(const char *key, const char *code, int virtual_key) {
    const char *types[]={"keyDown","keyUp"};
    for (guint i=0;i<G_N_ELEMENTS(types);++i) {
        char *q=quote(key), *c=quote(code);
        char *params=g_strdup_printf("{\"type\":\"%s\",\"key\":%s,\"code\":%s,\"windowsVirtualKeyCode\":%d,\"nativeVirtualKeyCode\":%d%s}",
            types[i],q,c,virtual_key,virtual_key,
            virtual_key==13 && i==0 ? ",\"text\":\"\\r\",\"unmodifiedText\":\"\\r\"" : "");
        command("Input.dispatchKeyEvent",params,TRUE);
        g_free(params); g_free(q); g_free(c);
    }
}
static void hide_keyboard(GtkWidget *widget, gpointer unused) {
    (void)widget; (void)unused; gtk_widget_hide(app.keyboard_panel);
}
static void keyboard_key(GtkWidget *widget, gpointer unused) {
    (void)unused;
    const char *key=gtk_button_get_label(GTK_BUTTON(widget));
    if (!strcmp(key,"Shift")) { app.uppercase=!app.uppercase; rebuild_keys(); return; }
    if (!strcmp(key,"123") || !strcmp(key,"123 / #+=" ) || !strcmp(key,"ABC")) {
        app.symbols=!app.symbols; rebuild_keys(); return;
    }
    if (!strcmp(key,"Hide")) { hide_keyboard(NULL,NULL); return; }
    GtkWidget *target=app.keyboard_target;
    if(target && !GTK_IS_ENTRY(target))target=NULL;
    if(!strcmp(key,"↑") || !strcmp(key,"↓") || !strcmp(key,"←") || !strcmp(key,"→")){
        int direction=!strcmp(key,"↑")?0:!strcmp(key,"↓")?1:!strcmp(key,"←")?2:3;
        if(target){int pos=gtk_editable_get_position(GTK_EDITABLE(target)),length=g_utf8_strlen(gtk_entry_get_text(GTK_ENTRY(target)),-1);gtk_editable_set_position(GTK_EDITABLE(target),direction==0?0:direction==1?length:CLAMP(pos+(direction==2?-1:1),0,length));}
        else{const char *keys[]={"ArrowUp","ArrowDown","ArrowLeft","ArrowRight"};const int codes[]={38,40,37,39};send_key(keys[direction],keys[direction],codes[direction]);}return;
    }
    const char *old=gtk_entry_get_text(GTK_ENTRY(app.keyboard_entry));
    if (!strcmp(key,"Clear")) {
        if(target){gtk_entry_set_text(GTK_ENTRY(target),"");gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),"");}
        return;
    }
    if (!strcmp(key,"Enter")) {
        if(target) {
            if(target==app.address){hide_keyboard(NULL,NULL);open_address(NULL,NULL);}
            else g_signal_emit_by_name(target,"activate");
        } else send_key("Enter","Enter",13);
        return;
    }
    if (!strcmp(key,"Backspace")) {
        const char *last=g_utf8_find_prev_char(old,old+strlen(old));
        char *text=g_strndup(old,last ? (gsize)(last-old) : 0);
        gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),text); g_free(text);
        if(target) {
            gint start,end;
            if(gtk_editable_get_selection_bounds(GTK_EDITABLE(target),&start,&end))gtk_editable_delete_text(GTK_EDITABLE(target),start,end);
            else {gint at=gtk_editable_get_position(GTK_EDITABLE(target));if(at>0)gtk_editable_delete_text(GTK_EDITABLE(target),at-1,at);}
            gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),gtk_entry_get_text(GTK_ENTRY(target)));
        } else send_key("Backspace","Backspace",8);
    } else {
        const char *insert=!strcmp(key,"Space") ? " " : key;
        char *text=g_strconcat(old,insert,NULL);
        gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),text); g_free(text);
        if(target) {
            gint start,end;
            if(gtk_editable_get_selection_bounds(GTK_EDITABLE(target),&start,&end))gtk_editable_delete_text(GTK_EDITABLE(target),start,end);
            gint at=gtk_editable_get_position(GTK_EDITABLE(target));gtk_editable_insert_text(GTK_EDITABLE(target),insert,-1,&at);gtk_editable_set_position(GTK_EDITABLE(target),at);
            gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),gtk_entry_get_text(GTK_ENTRY(target)));
        } else {
            char *q=quote(insert), *params=g_strdup_printf("{\"text\":%s}",q);
            command("Input.insertText",params,TRUE); g_free(params); g_free(q);
        }
    }
    gtk_editable_set_position(GTK_EDITABLE(app.keyboard_entry),-1);
}
static void key_button(GtkWidget *row, const char *label) {
    GtkWidget *key=gtk_button_new_with_label(label);
    touch_size(key,-1,app.landscape?64:96);
    touch_font(gtk_bin_get_child(GTK_BIN(key)),22);
    gtk_button_set_focus_on_click(GTK_BUTTON(key),FALSE);
    gtk_box_pack_start(GTK_BOX(row),key,TRUE,TRUE,0);
    g_signal_connect(key,"clicked",G_CALLBACK(keyboard_key),NULL);
}
static void rebuild_keys(void) {
    GList *children=gtk_container_get_children(GTK_CONTAINER(app.keyboard_rows));
    for (GList *i=children;i;i=i->next) gtk_widget_destroy(GTK_WIDGET(i->data));
    g_list_free(children);
    const char *letters[]={"qwertyuiop","asdfghjklñ","zxcvbnm,."};
    const char *symbols[]={"1234567890","@#%&*()-_",":;/?!+=\"'"};
    for (guint r=0;r<3;++r) {
        GtkWidget *row=gtk_hbox_new(TRUE,3);
        gtk_box_pack_start(GTK_BOX(app.keyboard_rows),row,FALSE,FALSE,2);
        const char *keys=app.symbols ? symbols[r] : letters[r];
        for (const char *p=keys;*p;p=g_utf8_next_char(p)) {
            gunichar code=g_utf8_get_char(p);
            if (app.uppercase && !app.symbols) code=g_unichar_toupper(code);
            char label[7]={0}; g_unichar_to_utf8(code,label);
            key_button(row,label);
        }
    }
    GtkWidget *row=gtk_hbox_new(FALSE,3);
    gtk_box_pack_start(GTK_BOX(app.keyboard_rows),row,FALSE,FALSE,2);
    key_button(row,"Shift"); key_button(row,app.symbols ? "ABC" : "123");
    key_button(row,"Space"); key_button(row,"Backspace"); key_button(row,"Enter");
    row=gtk_hbox_new(TRUE,3);gtk_box_pack_start(GTK_BOX(app.keyboard_rows),row,FALSE,FALSE,2);
    const char *arrows[]={"←","↑","↓","→"};for(int i=0;i<4;++i){key_button(row,arrows[i]);GList *keys=gtk_container_get_children(GTK_CONTAINER(row));touch_size(g_list_last(keys)->data,-1,app.landscape?48:64);g_list_free(keys);}
    gtk_widget_show_all(app.keyboard_rows);
}
static void keyboard(GtkWidget *widget,gpointer address_mode) {
    (void)widget;
    app.keyboard_address=GPOINTER_TO_INT(address_mode);
    if(app.keyboard_address)app.keyboard_target=app.address;
    gtk_entry_set_text(GTK_ENTRY(app.keyboard_entry),app.keyboard_target ? gtk_entry_get_text(GTK_ENTRY(app.keyboard_target)) : "");
    gtk_widget_show(app.keyboard_panel);
}
static void toggle_keyboard(GtkWidget *widget,gpointer unused) {
    (void)widget;(void)unused;
    if(GTK_WIDGET_VISIBLE(app.keyboard_panel)){hide_keyboard(NULL,NULL);app.keyboard_manual=FALSE;app.keyboard_suppressed=app.web_editing;}
    else{app.keyboard_manual=TRUE;app.keyboard_suppressed=FALSE;keyboard(NULL,GINT_TO_POINTER(app.keyboard_target==app.address));}
}
static gboolean entry_tapped(GtkWidget *widget,GdkEventButton *event,gpointer unused) {
    (void)unused;
    if(event->type==GDK_BUTTON_PRESS){app.keyboard_manual=FALSE;app.keyboard_target=widget;keyboard(NULL,GINT_TO_POINTER(widget==app.address));}
    return FALSE;
}
static void apply_user_agent(gboolean initial) {
    app.initial_navigation=initial;
    gboolean mobile=app.ua_next==1;
    const char *ua=mobile ?
        "Mozilla/5.0 (Linux; Android 11; Kindle PW3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36" :
        "Mozilla/5.0 (X11; Debian 13; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
    char *q=quote(ua);
    char *params=g_strdup_printf("{\"userAgent\":%s,\"platform\":\"Linux armv7l\",\"acceptLanguage\":\"en-US,en;q=0.9\",\"userAgentMetadata\":{\"brands\":[{\"brand\":\"Chromium\",\"version\":\"156\"}],\"fullVersionList\":[{\"brand\":\"Chromium\",\"version\":\"156.0.8078.73\"}],\"fullVersion\":\"156.0.8078.73\",\"platform\":\"%s\",\"platformVersion\":\"%s\",\"architecture\":\"arm\",\"model\":\"%s\",\"mobile\":%s,\"bitness\":\"32\",\"wow64\":false}}",
        q,mobile ? "Android" : "Linux",mobile ? "11.0.0" : "13.0.0",mobile ? "Kindle PW3" : "",mobile ? "true" : "false");
    app.ua_id=command("Emulation.setUserAgentOverride",params,TRUE);
    g_free(q); g_free(params);
}
static gboolean draw_page(GtkWidget *widget,GdkEventExpose *event,gpointer unused) {
    (void)unused;
    cairo_t *c=gdk_cairo_create(widget->window);cairo_rectangle(c,event->area.x,event->area.y,event->area.width,event->area.height);cairo_clip(c);cairo_set_source_rgb(c,1,1,1);cairo_paint(c);
    if(app.frame){cairo_scale(c,(double)widget->allocation.width/gdk_pixbuf_get_width(app.frame),(double)widget->allocation.height/gdk_pixbuf_get_height(app.frame));gdk_cairo_set_source_pixbuf(c,app.frame,0,0);cairo_paint(c);}cairo_destroy(c);
    return FALSE;
}
static void quit(GtkWidget *widget, gpointer unused) {
    (void)widget; (void)unused; gtk_main_quit();
}
static GtkWidget *button(GtkWidget *row,const char *label,GCallback callback,gpointer data) {
    GtkWidget *b=gtk_button_new_with_label(label);
    touch_font(gtk_bin_get_child(GTK_BIN(b)),18);gtk_label_set_line_wrap(GTK_LABEL(gtk_bin_get_child(GTK_BIN(b))),TRUE);
    touch_size(b,72,64);gtk_button_set_focus_on_click(GTK_BUTTON(b),FALSE);
    gtk_box_pack_start(GTK_BOX(row),b,TRUE,TRUE,2);
    g_signal_connect(b,"clicked",callback,data); return b;
}
#include "shell.inc"

static int self_test(void) {
    const char *sample="{\"id\":7,\"result\":{\"text\":\"a\\n\\u00f1\\ud83d\\ude00\",\"nested\":{\"id\":99}},\"tail\":42}";
    jsmn_parser p; jsmntok_t t[64]; jsmn_init(&p);
    int n=jsmn_parse(&p,sample,strlen(sample),t,G_N_ELEMENTS(t));
    if (n<1 || number(sample,t,member(sample,t,n,0,"id"))!=7 ||
        number(sample,t,member(sample,t,n,0,"tail"))!=42) return 1;
    int result=member(sample,t,n,0,"result");
    char *text=string_value(sample,t,member(sample,t,n,result,"text"));
    gboolean ok=text && !strcmp(text,"a\n\xc3\xb1\xf0\x9f\x98\x80");
    char *q=quote("\"a\\\n");
    ok=ok && !strcmp(q,"\"\\\"a\\\\\\u000a\"");
    g_free(text); g_free(q);
    puts(ok ? "Protocol self-test passed" : "Protocol self-test failed");
    return ok ? 0 : 1;
}
int main(int argc,char **argv) {
    if (argc==2 && !strcmp(argv[1],"--self-test")) return self_test();
    const char *engine=NULL,*profile=NULL,*url=NULL,*assets=NULL;
    gboolean unsafe=FALSE;
    for (int i=1;i<argc;++i) {
        if (!strcmp(argv[i],"--engine") && i+1<argc) engine=argv[++i];
        else if (!strcmp(argv[i],"--profile") && i+1<argc) profile=argv[++i];
        else if (!strcmp(argv[i],"--assets") && i+1<argc) assets=argv[++i];
        else if (!strcmp(argv[i],"--url") && i+1<argc) url=argv[++i];
        else if (!strcmp(argv[i],"--unsafe-no-sandbox")) unsafe=TRUE;
        else if (!strcmp(argv[i],"--full-page")) app.full_page=TRUE;
#ifdef BROWSER_TEST
        else if (!strcmp(argv[i],"--test-screenshot") && i+1<argc) test_screenshot=argv[++i];
#endif
        else { fprintf(stderr,"Unknown or incomplete argument: %s\n",argv[i]); return 2; }
    }
    if (!engine || !profile || engine[0]!='/' || profile[0]!='/') {
        fprintf(stderr,"Usage: %s --engine /absolute/headless_shell --profile /absolute/profile [--url URL] [--unsafe-no-sandbox]\n",argv[0]);
        return 2;
    }
    if ((url && !g_utf8_validate(url,-1,NULL)) || !assets || assets[0]!='/') return 2;
    if (g_mkdir_with_parents(profile,0700)<0) { perror("profile"); return 1; }
    signal(SIGPIPE,SIG_IGN);
    signal(SIGTERM,stop_signal);
    signal(SIGINT,stop_signal);
    if (!gtk_init_check(NULL,NULL)) { fprintf(stderr,"Cannot connect to X11 display\n"); return 1; }
    g_object_set(gtk_settings_get_default(),"gtk-theme-name","Raleigh","gtk-xft-dpi",96*1024,NULL);
    gtk_rc_parse_string(
        "style \"kindle-monochrome\" { engine \"\" {} font_name = \"Sans 18\" "
        "bg[NORMAL] = \"#ffffff\" bg[PRELIGHT] = \"#eeeeee\" bg[ACTIVE] = \"#cccccc\" "
        "fg[NORMAL] = \"#000000\" fg[PRELIGHT] = \"#000000\" fg[ACTIVE] = \"#000000\" "
        "base[NORMAL] = \"#ffffff\" text[NORMAL] = \"#000000\" "
        "base[SELECTED] = \"#333333\" text[SELECTED] = \"#ffffff\" } "
        "class \"GtkWidget\" style \"kindle-monochrome\"");
    app.width=1072; app.height=1300; app.read_fd=-1; app.write_fd=-1;
    app.incoming=g_byte_array_new(); app.outgoing=g_byte_array_new();
    app.assets=g_strdup(assets);load_state(profile);
    app.orientation_helper=g_strdup(g_getenv("KHROMIUM_ORIENTATION_HELPER"));
    app.restore_orientation=g_strdup(g_getenv("KHROMIUM_ORIENTATION_PREVIOUS"));
    app.initial_url=g_strdup(url ? url : app.full_page ? app.full_url : app.homepage);
    app.last_url=g_strdup(app.initial_url);app.last_title=g_strdup("Khromium");
    app.ua_next=app.ua;
    build_window();
    orientation_apply();
    if (!launch_engine(engine,profile,unsafe)) notice("Could not start the browser engine.");
    app.frame_timer=g_timeout_add(1000,capture,NULL);
    app.focus_timer=g_timeout_add(500,poll_focus,NULL);
#ifdef BROWSER_TEST
    if (test_screenshot) g_timeout_add_seconds(120,test_timeout,NULL);
#endif
    gtk_main();
    if (app.focus_timer)g_source_remove(app.focus_timer);
    if (app.hold_timer)g_source_remove(app.hold_timer);
    if (app.frame_timer) g_source_remove(app.frame_timer);
    if (app.resize_timer) g_source_remove(app.resize_timer);
    if (app.read_watch) g_source_remove(app.read_watch);
    if (app.write_watch) g_source_remove(app.write_watch);
    if (app.child_watch) g_source_remove(app.child_watch);
    if (app.reader) g_io_channel_unref(app.reader);
    if (app.writer) g_io_channel_unref(app.writer);
    if (app.child>0) {
        kill(-app.child,SIGTERM);
        for (int i=0;i<30 && waitpid(app.child,NULL,WNOHANG)==0;++i) usleep(50000);
        if (waitpid(app.child,NULL,WNOHANG)==0) { kill(-app.child,SIGKILL); waitpid(app.child,NULL,0); }
    }
    g_byte_array_unref(app.incoming); g_byte_array_unref(app.outgoing);
    g_free(app.session);g_free(app.initial_url);g_free(app.main_frame);
    save_preferences();save_pages(app.favorites,app.favorites_path);save_pages(app.visits,app.visits_path);
    g_ptr_array_free(app.favorites,TRUE);g_ptr_array_free(app.visits,TRUE);g_key_file_free(app.preferences);
    g_free(app.assets);g_free(app.prefs_path);g_free(app.favorites_path);g_free(app.visits_path);g_free(app.homepage);g_free(app.last_url);g_free(app.last_title);
    if(app.orientation_helper && app.restore_orientation && strlen(app.restore_orientation)==1 && strchr("UDLR",app.restore_orientation[0])){char *args[]={app.orientation_helper,"set",app.restore_orientation,NULL};g_spawn_sync(NULL,args,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL);}
    g_free(app.orientation_helper);g_free(app.restore_orientation);g_free(app.full_url);
    if (app.frame) g_object_unref(app.frame);
#ifdef BROWSER_TEST
    if (test_screenshot) return test_result;
#endif
    return 0;
}
