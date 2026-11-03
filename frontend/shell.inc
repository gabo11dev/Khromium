typedef struct { char *title,*url; } SavedPage;
static void free_page(gpointer value){SavedPage *p=value;g_free(p->title);g_free(p->url);g_free(p);}
static void add_page(GPtrArray *list,const char *title,const char *url){
    SavedPage *p=g_new0(SavedPage,1);p->title=g_strdup(title && *title ? title:url);p->url=g_strdup(url);g_ptr_array_add(list,p);
}
static void save_pages(GPtrArray *list,const char *path){
    GKeyFile *file=g_key_file_new();
    for(guint i=0;i<list->len;++i){SavedPage *p=g_ptr_array_index(list,i);char group[32];g_snprintf(group,sizeof(group),"Page%u",i);g_key_file_set_string(file,group,"title",p->title);g_key_file_set_string(file,group,"url",p->url);}
    gsize length;char *data=g_key_file_to_data(file,&length,NULL);g_file_set_contents(path,data,length,NULL);g_free(data);g_key_file_free(file);
}
static GPtrArray *load_pages(const char *path){
    GPtrArray *list=g_ptr_array_new_with_free_func(free_page);GKeyFile *file=g_key_file_new();
    if(g_key_file_load_from_file(file,path,G_KEY_FILE_NONE,NULL)){
        gsize n;char **groups=g_key_file_get_groups(file,&n);
        for(gsize i=0;i<n && i<128;++i){char *title=g_key_file_get_string(file,groups[i],"title",NULL),*url=g_key_file_get_string(file,groups[i],"url",NULL);
            if(title && url && g_utf8_validate(title,-1,NULL) && g_utf8_validate(url,-1,NULL))add_page(list,title,url);
            g_free(title);g_free(url);
        }g_strfreev(groups);
    }g_key_file_free(file);return list;
}
static gboolean retired_internal_url(const char *url){
    if(!url)return FALSE;
    char *value=g_ascii_strdown(url,-1);const char *removed[]={"chrome://settings","chromium://settings","chrome://dino","chromium://dino"};gboolean retired=FALSE;
    for(guint i=0;i<G_N_ELEMENTS(removed);++i){gsize n=strlen(removed[i]);if(g_str_has_prefix(value,removed[i]) && (!value[n] || strchr("/?#",value[n]))){retired=TRUE;break;}}g_free(value);return retired;
}
static void remove_retired_pages(GPtrArray *list,const char *path){gboolean changed=FALSE;for(guint i=0;i<list->len;){SavedPage *page=g_ptr_array_index(list,i);if(retired_internal_url(page->url)){g_ptr_array_remove_index(list,i);changed=TRUE;}else ++i;}if(changed)save_pages(list,path);}
static void save_preferences(void){
    if(!app.preferences)return;
    g_key_file_set_string(app.preferences,"Browser","homepage",app.homepage);
    g_key_file_set_integer(app.preferences,"Browser","search",app.search_engine);
    g_key_file_set_integer(app.preferences,"Browser","user_agent",app.ua);
    g_key_file_set_integer(app.preferences,"Browser","ui_scale",app.ui_scale);
    g_key_file_set_integer(app.preferences,"Browser","page_scale",app.page_scale);
    g_key_file_set_integer(app.preferences,"Browser","orientation",app.orientation);
    g_key_file_set_integer(app.preferences,"FullPage","orientation",app.full_orientation);
    g_key_file_set_string(app.preferences,"FullPage","url",app.full_url);
    gsize length;char *data=g_key_file_to_data(app.preferences,&length,NULL);g_file_set_contents(app.prefs_path,data,length,NULL);g_free(data);
}
static void load_state(const char *profile){
    app.prefs_path=g_build_filename(profile,"khromium.ini",NULL);app.favorites_path=g_build_filename(profile,"favorites.ini",NULL);app.visits_path=g_build_filename(profile,"history.ini",NULL);
    app.preferences=g_key_file_new();g_key_file_load_from_file(app.preferences,app.prefs_path,G_KEY_FILE_NONE,NULL);
    app.homepage=g_key_file_get_string(app.preferences,"Browser","homepage",NULL);
    if(!app.homepage || !*app.homepage || !g_utf8_validate(app.homepage,-1,NULL) || retired_internal_url(app.homepage)){g_free(app.homepage);app.homepage=g_strdup("khromium://home");}
    app.search_engine=CLAMP(g_key_file_get_integer(app.preferences,"Browser","search",NULL),0,2);
    app.ua=CLAMP(g_key_file_get_integer(app.preferences,"Browser","user_agent",NULL),0,1);
    app.ui_scale=g_key_file_get_integer(app.preferences,"Browser","ui_scale",NULL);if(!app.ui_scale)app.ui_scale=100;app.ui_scale=CLAMP(app.ui_scale,75,150);
    app.page_scale=g_key_file_get_integer(app.preferences,"Browser","page_scale",NULL);if(!app.page_scale)app.page_scale=100;app.page_scale=CLAMP(app.page_scale,50,250);
    app.orientation=CLAMP(g_key_file_get_integer(app.preferences,"Browser","orientation",NULL),0,3);app.full_orientation=CLAMP(g_key_file_get_integer(app.preferences,"FullPage","orientation",NULL),0,3);
    app.full_url=g_key_file_get_string(app.preferences,"FullPage","url",NULL);if(!app.full_url || !*app.full_url || !g_utf8_validate(app.full_url,-1,NULL) || retired_internal_url(app.full_url)){g_free(app.full_url);app.full_url=g_strdup("khromium://home");}
    app.favorites=load_pages(app.favorites_path);app.visits=load_pages(app.visits_path);
    remove_retired_pages(app.favorites,app.favorites_path);remove_retired_pages(app.visits,app.visits_path);
}
static void record_visit(const char *url,const char *title){
    if(!url || !*url || !app.visits || !strcmp(url,"about:blank"))return;
    if(app.visits->len){SavedPage *last=g_ptr_array_index(app.visits,0);if(!strcmp(last->url,url)){g_free(last->title);last->title=g_strdup(title);save_pages(app.visits,app.visits_path);return;}}
    add_page(app.visits,title,url);
    gpointer p=app.visits->pdata[app.visits->len-1];memmove(app.visits->pdata+1,app.visits->pdata,(app.visits->len-1)*sizeof(gpointer));app.visits->pdata[0]=p;
    if(app.visits->len>100)g_ptr_array_remove_index(app.visits,100);
    save_pages(app.visits,app.visits_path);
}
static char *resolve_input(const char *text,int engine){
    char *value=g_strdup(text);g_strstrip(value);if(!*value){g_free(value);return NULL;}
    const char *schemes[]={"https://","http://","file://","khromium://","chromium://","chrome://","about:"};
    for(guint i=0;i<G_N_ELEMENTS(schemes);++i)if(g_str_has_prefix(value,schemes[i]))return value;
    gboolean whitespace=strpbrk(value," \t\r\n")!=NULL;
    if((!whitespace && (strchr(value,'.') || g_str_has_prefix(value,"localhost") || strchr(value,'/'))) || engine==0){
        if(whitespace){g_free(value);return NULL;}char *url=g_strconcat("https://",value,NULL);g_free(value);return url;
    }
    char *escaped=g_uri_escape_string(value,NULL,FALSE);char *url=g_strconcat(engine==1 ? "https://www.google.com/search?q=":"https://duckduckgo.com/?q=",escaped,NULL);g_free(escaped);g_free(value);return url;
}
static char *asset_uri(const char *name){char *path=g_build_filename(app.assets,name,NULL);char *uri=g_filename_to_uri(path,NULL,NULL);g_free(path);return uri;}
static char *page_url(const char *url){
    if(!strcmp(url,"khromium://home") || !strcmp(url,"about:home") || !strcmp(url,"chromium://newtab")){
        char *base=asset_uri("home.html");char *full=g_strdup_printf("%s?engine=%s",base,app.search_engine==1 ? "google":app.search_engine==2 ? "duckduckgo":"www");g_free(base);return full;
    }
    if(g_str_has_prefix(url,"https://") || g_str_has_prefix(url,"http://") || g_str_has_prefix(url,"file://") || !strcmp(url,"about:blank"))return g_strdup(url);
#ifdef BROWSER_TEST
    if(g_str_has_prefix(url,"data:"))return g_strdup(url);
#endif
    return NULL;
}
static char *visible_url(const char *url){
    char *home_uri=asset_uri("home.html");char *result=g_strdup(g_str_has_prefix(url,home_uri)?"khromium://home":url);g_free(home_uri);return result;
}
static void home(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;navigate(app.homepage);}
#include "panels.inc"
typedef struct {GtkWidget *dialog,*tree,*name;gboolean favorites;} PageList;
static void populate_pages(PageList *ui){
    GtkListStore *store=GTK_LIST_STORE(gtk_tree_view_get_model(GTK_TREE_VIEW(ui->tree)));gtk_list_store_clear(store);GPtrArray *pages=ui->favorites ? app.favorites:app.visits;
    for(guint i=0;i<pages->len;++i){SavedPage *p=g_ptr_array_index(pages,i);GtkTreeIter row;gtk_list_store_append(store,&row);char *caption=g_strdup_printf("%s\n%s",p->title,p->url);gtk_list_store_set(store,&row,0,caption,1,p->url,2,(int)i,-1);g_free(caption);}
}
static gboolean selected_page(PageList *ui,char **url,int *index){
    GtkTreeModel *model;GtkTreeIter iter;GtkTreeSelection *selection=gtk_tree_view_get_selection(GTK_TREE_VIEW(ui->tree));
    if(!gtk_tree_selection_get_selected(selection,&model,&iter))return FALSE;
    gtk_tree_model_get(model,&iter,1,url,2,index,-1);return TRUE;
}
static void open_saved(GtkWidget *widget,gpointer value){
    (void)widget;PageList *ui=value;char *url=NULL;int index;if(!selected_page(ui,&url,&index))return;
    panel_close(NULL,NULL);navigate(url);g_free(url);
}
static void save_current(GtkWidget *widget,gpointer value){
    (void)widget;PageList *ui=value;const char *title=gtk_entry_get_text(GTK_ENTRY(ui->name));const char *url=app.last_url ? app.last_url:"khromium://home";
    for(guint i=0;i<app.favorites->len;++i){SavedPage *p=g_ptr_array_index(app.favorites,i);if(!strcmp(p->url,url)){g_free(p->title);p->title=g_strdup(*title ? title:url);save_pages(app.favorites,app.favorites_path);populate_pages(ui);return;}}
    if(app.favorites->len>=128){notice("Favorites is full (128 pages).");return;}add_page(app.favorites,title,url);save_pages(app.favorites,app.favorites_path);populate_pages(ui);
}
static void remove_saved(GtkWidget *widget,gpointer value){
    (void)widget;PageList *ui=value;char *url=NULL;int index;if(!selected_page(ui,&url,&index))return;g_free(url);
    GPtrArray *pages=ui->favorites ? app.favorites:app.visits;g_ptr_array_remove_index(pages,index);save_pages(pages,ui->favorites ? app.favorites_path:app.visits_path);populate_pages(ui);
}
static void list_destroyed(GtkWidget *widget,gpointer value){(void)widget;g_free(value);}
static void show_page_list(gboolean favorites){
    PageList *ui=g_new0(PageList,1);ui->favorites=favorites;ui->dialog=panel_open(favorites ? "Favorites":"History");
    GtkWidget *box=ui->dialog,*scroll=gtk_scrolled_window_new(NULL,NULL);gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(scroll),GTK_POLICY_NEVER,GTK_POLICY_AUTOMATIC);gtk_widget_set_size_request(scroll,-1,350);
    GtkListStore *store=gtk_list_store_new(3,G_TYPE_STRING,G_TYPE_STRING,G_TYPE_INT);ui->tree=gtk_tree_view_new_with_model(GTK_TREE_MODEL(store));g_object_unref(store);gtk_tree_view_set_headers_visible(GTK_TREE_VIEW(ui->tree),FALSE);
    GtkCellRenderer *renderer=gtk_cell_renderer_text_new();g_object_set(renderer,"ypad",12,"ellipsize",PANGO_ELLIPSIZE_END,NULL);gtk_tree_view_append_column(GTK_TREE_VIEW(ui->tree),gtk_tree_view_column_new_with_attributes("Page",renderer,"text",0,NULL));gtk_container_add(GTK_CONTAINER(scroll),ui->tree);gtk_box_pack_start(GTK_BOX(box),scroll,TRUE,TRUE,0);
    if(favorites){GtkWidget *label=gtk_label_new("Save the current page as:");gtk_box_pack_start(GTK_BOX(box),label,FALSE,FALSE,0);ui->name=text_entry(app.last_title);gtk_box_pack_start(GTK_BOX(box),ui->name,FALSE,FALSE,0);}
    GtkWidget *buttons=gtk_hbox_new(FALSE,5);button(buttons,"Open",G_CALLBACK(open_saved),ui);if(favorites)button(buttons,"Save current page",G_CALLBACK(save_current),ui);button(buttons,"Remove",G_CALLBACK(remove_saved),ui);button(buttons,"Close",G_CALLBACK(panel_close),NULL);gtk_box_pack_start(GTK_BOX(box),buttons,FALSE,FALSE,0);
    populate_pages(ui);g_signal_connect(ui->dialog,"destroy",G_CALLBACK(list_destroyed),ui);apply_ui_scale();gtk_widget_show_all(ui->dialog);
}
static void show_favorites(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;show_page_list(TRUE);}
static void show_history(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;show_page_list(FALSE);}
static void more(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(app.more_menu){panel_close(NULL,NULL);return;}
    GtkWidget *root=panel_open("Khromium"),*list=scroll_box(root);app.more_menu=root;
    const char *names[]={"History","Favorites","Settings"};GCallback actions[]={G_CALLBACK(show_history),G_CALLBACK(show_favorites),G_CALLBACK(show_settings)};
    for(int i=0;i<3;++i){GtkWidget *row=gtk_hbox_new(FALSE,0);GtkWidget *b=button(row,names[i],actions[i],NULL);touch_size(b,-1,88);gtk_box_pack_start(GTK_BOX(list),row,FALSE,FALSE,4);gtk_box_pack_start(GTK_BOX(list),gtk_hseparator_new(),FALSE,FALSE,0);}
    apply_ui_scale();gtk_widget_show_all(root);
}
enum {ICON_HOME,ICON_BACK,ICON_RELOAD,ICON_FORWARD,ICON_KEYBOARD,ICON_MORE,ICON_EXIT,ICON_REFRESH};
static void update_icon(GtkWidget *image,int kind){
    int size=scaled(36);cairo_surface_t *surface=cairo_image_surface_create(CAIRO_FORMAT_ARGB32,size,size);cairo_t *c=cairo_create(surface);cairo_set_source_rgb(c,1,1,1);cairo_paint(c);cairo_scale(c,size/36.0,size/36.0);cairo_translate(c,2,2);cairo_set_source_rgb(c,0,0,0);cairo_set_line_width(c,2.4);cairo_set_line_cap(c,CAIRO_LINE_CAP_ROUND);cairo_set_line_join(c,CAIRO_LINE_JOIN_ROUND);
    switch(kind){
    case ICON_HOME:cairo_move_to(c,3,15);cairo_line_to(c,16,4);cairo_line_to(c,29,15);cairo_move_to(c,7,13);cairo_line_to(c,7,28);cairo_line_to(c,13,28);cairo_line_to(c,13,20);cairo_line_to(c,20,20);cairo_line_to(c,20,28);cairo_line_to(c,26,28);cairo_line_to(c,26,13);break;
    case ICON_BACK:case ICON_FORWARD:{gboolean forward=kind==ICON_FORWARD;if(forward){cairo_translate(c,32,0);cairo_scale(c,-1,1);}cairo_move_to(c,26,16);cairo_line_to(c,5,16);cairo_line_to(c,14,7);cairo_move_to(c,5,16);cairo_line_to(c,14,25);break;}
    case ICON_RELOAD:cairo_set_line_width(c,2.7);cairo_arc(c,16,16,11,0.45,5.5);cairo_move_to(c,24,1);cairo_line_to(c,24,8);cairo_line_to(c,17,8);break;
    case ICON_KEYBOARD:cairo_rectangle(c,2,7,28,20);for(int row=0;row<2;++row)for(int column=0;column<5;++column){cairo_move_to(c,6+column*5,12+row*5);cairo_line_to(c,7+column*5,12+row*5);}cairo_move_to(c,10,23);cairo_line_to(c,22,23);break;
    case ICON_MORE:for(int i=0;i<3;++i){cairo_arc(c,16,7+i*9,1.8,0,6.29);cairo_fill(c);}break;
    case ICON_REFRESH:cairo_rectangle(c,3,3,26,26);cairo_move_to(c,8,22);cairo_line_to(c,8,10);cairo_line_to(c,13,15);cairo_move_to(c,8,10);cairo_line_to(c,18,10);cairo_move_to(c,24,10);cairo_line_to(c,24,22);cairo_line_to(c,19,17);cairo_move_to(c,24,22);cairo_line_to(c,14,22);break;
    case ICON_EXIT:cairo_move_to(c,7,7);cairo_line_to(c,25,25);cairo_move_to(c,25,7);cairo_line_to(c,7,25);break;
    }
    cairo_stroke(c);cairo_destroy(c);cairo_surface_flush(surface);
    GdkPixbuf *pix=gdk_pixbuf_new(GDK_COLORSPACE_RGB,FALSE,8,size,size);guchar *pixels=gdk_pixbuf_get_pixels(pix),*source=cairo_image_surface_get_data(surface);int stride=gdk_pixbuf_get_rowstride(pix),src_stride=cairo_image_surface_get_stride(surface);
    for(int y=0;y<size;++y)for(int x=0;x<size;++x){guchar *out=pixels+y*stride+x*3,*in=source+y*src_stride+x*4;out[0]=in[2];out[1]=in[1];out[2]=in[0];}
    gtk_image_set_from_pixbuf(GTK_IMAGE(image),pix);g_object_unref(pix);cairo_surface_destroy(surface);
}
static GtkWidget *icon_button(GtkWidget *row,const char *name,int icon,GCallback callback,gpointer value){
    GtkWidget *b=gtk_button_new(),*drawing=gtk_image_new();gtk_button_set_relief(GTK_BUTTON(b),GTK_RELIEF_NONE);touch_size(b,62,66);gtk_button_set_focus_on_click(GTK_BUTTON(b),FALSE);gtk_container_add(GTK_CONTAINER(b),drawing);atk_object_set_name(gtk_widget_get_accessible(b),name);gtk_box_pack_start(GTK_BOX(row),b,FALSE,FALSE,0);g_object_set_data(G_OBJECT(drawing),"icon-kind",GINT_TO_POINTER(icon+1));update_icon(drawing,icon);g_signal_connect(b,"clicked",callback,value);return b;
}
static void build_window(void){
    app.window=gtk_window_new(GTK_WINDOW_TOPLEVEL);gtk_window_set_title(GTK_WINDOW(app.window),"Khromium 156.0 SF Build 1 (Alpha)");
#ifdef KINDLE_UI
    gtk_window_set_title(GTK_WINDOW(app.window),app.full_page?"L:A_N:application_PC:N_ID:org.khromium.sf_O:UDLR":"L:A_N:application_PC:T_ID:org.khromium.sf_O:UDLR");gtk_window_set_decorated(GTK_WINDOW(app.window),FALSE);
#endif
    gtk_window_set_default_size(GTK_WINDOW(app.window),1072,1360);g_signal_connect(app.window,"configure-event",G_CALLBACK(window_configure),NULL);
    GtkWidget *box=gtk_vbox_new(FALSE,0),*bar=gtk_hbox_new(FALSE,1);app.toolbar=bar;gtk_container_add(GTK_CONTAINER(app.window),box);gtk_box_pack_start(GTK_BOX(box),bar,FALSE,FALSE,0);
    icon_button(bar,"Home",ICON_HOME,G_CALLBACK(home),NULL);icon_button(bar,"Back",ICON_BACK,G_CALLBACK(history),GINT_TO_POINTER(-1));icon_button(bar,"Reload",ICON_RELOAD,G_CALLBACK(reload_page),NULL);icon_button(bar,"Forward",ICON_FORWARD,G_CALLBACK(history),GINT_TO_POINTER(1));
    app.address=text_entry("");gtk_entry_set_width_chars(GTK_ENTRY(app.address),8);gtk_box_pack_start(GTK_BOX(bar),app.address,TRUE,TRUE,0);atk_object_set_name(gtk_widget_get_accessible(app.address),"Search or enter address");
    icon_button(bar,"Keyboard",ICON_KEYBOARD,G_CALLBACK(toggle_keyboard),NULL);icon_button(bar,"Refresh screen",ICON_REFRESH,G_CALLBACK(refresh_screen),NULL);icon_button(bar,"More",ICON_MORE,G_CALLBACK(more),NULL);icon_button(bar,"Exit",ICON_EXIT,G_CALLBACK(quit),NULL);
    app.bar_separator=gtk_hseparator_new();gtk_box_pack_start(GTK_BOX(box),app.bar_separator,FALSE,FALSE,0);
    app.status=gtk_label_new("Starting Khromium…");gtk_widget_set_size_request(app.status,-1,36);gtk_box_pack_start(GTK_BOX(box),app.status,FALSE,FALSE,0);
    app.viewport=gtk_event_box_new();app.image=gtk_drawing_area_new();gtk_widget_set_size_request(app.viewport,320,200);gtk_container_add(GTK_CONTAINER(app.viewport),app.image);app.content=gtk_vbox_new(FALSE,0);gtk_box_pack_start(GTK_BOX(box),app.content,TRUE,TRUE,0);gtk_box_pack_start(GTK_BOX(app.content),app.viewport,TRUE,TRUE,0);g_signal_connect(app.image,"expose-event",G_CALLBACK(draw_page),NULL);
    app.keyboard_panel=gtk_vbox_new(FALSE,2);
    /* Keep input bookkeeping private: only the keys are visible. */
    app.keyboard_entry=gtk_entry_new();gtk_editable_set_editable(GTK_EDITABLE(app.keyboard_entry),FALSE);gtk_widget_set_no_show_all(app.keyboard_entry,TRUE);gtk_box_pack_start(GTK_BOX(app.keyboard_panel),app.keyboard_entry,FALSE,FALSE,0);
    app.keyboard_rows=gtk_vbox_new(FALSE,2);gtk_box_pack_start(GTK_BOX(app.keyboard_panel),app.keyboard_rows,FALSE,FALSE,0);rebuild_keys();gtk_box_pack_end(GTK_BOX(box),app.keyboard_panel,FALSE,FALSE,0);
    gtk_widget_add_events(app.viewport,GDK_BUTTON_PRESS_MASK|GDK_BUTTON_RELEASE_MASK|GDK_SCROLL_MASK|GDK_POINTER_MOTION_MASK);g_signal_connect(app.viewport,"button-press-event",G_CALLBACK(click_page),NULL);g_signal_connect(app.viewport,"button-release-event",G_CALLBACK(click_page),NULL);g_signal_connect(app.viewport,"motion-notify-event",G_CALLBACK(page_motion),NULL);g_signal_connect(app.viewport,"scroll-event",G_CALLBACK(scroll_event),NULL);g_signal_connect(app.viewport,"size-allocate",G_CALLBACK(resize_page),NULL);g_signal_connect(app.address,"activate",G_CALLBACK(open_address),NULL);g_signal_connect(app.window,"destroy",G_CALLBACK(quit),NULL);
    apply_ui_scale();
    if(app.full_page){gtk_widget_set_no_show_all(app.toolbar,TRUE);gtk_widget_set_no_show_all(app.bar_separator,TRUE);gtk_widget_set_no_show_all(app.status,TRUE);}
    gtk_widget_show_all(app.window);gtk_widget_hide(app.keyboard_panel);
    if(app.full_page)gtk_window_fullscreen(GTK_WINDOW(app.window));

}
