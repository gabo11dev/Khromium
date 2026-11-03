/* Every panel is a child of the application window. No GtkMenu, combo-box
 * popup or secondary top-level window is exposed to the Kindle manager. */
static int scaled(int value){return value<0?value:MAX(1,value*app.ui_scale/100);}
static void touch_size(GtkWidget *widget,int width,int height){
    g_object_set_data(G_OBJECT(widget),"base-width",GINT_TO_POINTER(width+2));
    g_object_set_data(G_OBJECT(widget),"base-height",GINT_TO_POINTER(height+2));
    gtk_widget_set_size_request(widget,scaled(width),scaled(height));
}
static void touch_font(GtkWidget *widget,int points){
    g_object_set_data(G_OBJECT(widget),"base-font",GINT_TO_POINTER(points));
    PangoFontDescription *font=pango_font_description_new();pango_font_description_set_family(font,"Sans");
    pango_font_description_set_absolute_size(font,points*(96.0/72.0)*app.ui_scale/100.0*PANGO_SCALE);
    gtk_widget_modify_font(widget,font);pango_font_description_free(font);
}
static void scale_widget(GtkWidget *widget){
    gpointer width=g_object_get_data(G_OBJECT(widget),"base-width"),height=g_object_get_data(G_OBJECT(widget),"base-height");
    if(width && height)gtk_widget_set_size_request(widget,scaled(GPOINTER_TO_INT(width)-2),scaled(GPOINTER_TO_INT(height)-2));
    int icon=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(widget),"icon-kind"));if(icon)update_icon(widget,icon-1);
    if(GTK_IS_LABEL(widget) || GTK_IS_ENTRY(widget)){int size=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(widget),"base-font"));touch_font(widget,size?size:18);}
    if(GTK_IS_CONTAINER(widget)){GList *children=gtk_container_get_children(GTK_CONTAINER(widget));for(GList *p=children;p;p=p->next)scale_widget(p->data);g_list_free(children);}
}
static void apply_ui_scale(void){scale_widget(app.window);gtk_widget_queue_resize(app.window);}
static const char *orientation_code(int value){const char *codes[]={"U","R","D","L"};return codes[CLAMP(value,0,3)];}
static void orientation_apply(void){
    if(!app.orientation_helper || app.orientation_helper[0]!='/')return;
    char *args[]={app.orientation_helper,"set",(char*)orientation_code(app.full_page?app.full_orientation:app.orientation),NULL};
    gint status=0;GError *error=NULL;
    if(!g_spawn_sync(NULL,args,NULL,0,NULL,NULL,NULL,NULL,&status,&error) || status!=0){fprintf(stderr,"Orientation request failed%s%s\n",error?": ":"",error?error->message:"");if(error)g_error_free(error);}
}
static gboolean entry_focus_out(GtkWidget *widget,GdkEventFocus *event,gpointer unused){
    (void)event;(void)unused;if(app.keyboard_target==widget){app.keyboard_target=NULL;app.keyboard_manual=FALSE;hide_keyboard(NULL,NULL);}return FALSE;
}
static void entry_destroyed(GtkWidget *widget,gpointer unused){(void)unused;if(app.keyboard_target==widget){app.keyboard_target=NULL;hide_keyboard(NULL,NULL);}}
static GtkWidget *text_entry(const char *value){
    GtkWidget *entry=gtk_entry_new();touch_size(entry,-1,54);touch_font(entry,18);gtk_entry_set_text(GTK_ENTRY(entry),value?value:"");
    g_signal_connect(entry,"button-press-event",G_CALLBACK(entry_tapped),NULL);g_signal_connect(entry,"focus-out-event",G_CALLBACK(entry_focus_out),NULL);g_signal_connect(entry,"destroy",G_CALLBACK(entry_destroyed),NULL);return entry;
}
static void panel_destroyed(GtkWidget *widget,gpointer unused){(void)unused;if(app.panel==widget)app.panel=NULL;if(app.settings_dialog==widget){app.settings_dialog=NULL;app.settings_notice=NULL;}if(app.more_menu==widget)app.more_menu=NULL;}
static void panel_close(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;hide_keyboard(NULL,NULL);app.keyboard_target=NULL;app.keyboard_manual=FALSE;app.keyboard_suppressed=app.web_editing;
    if(app.panel)gtk_widget_destroy(app.panel);gtk_widget_show(app.viewport);
}
static GtkWidget *panel_open(const char *title){
    panel_close(NULL,NULL);
    GtkWidget *root=gtk_vbox_new(FALSE,8);app.panel=root;g_signal_connect(root,"destroy",G_CALLBACK(panel_destroyed),NULL);gtk_container_set_border_width(GTK_CONTAINER(root),12);gtk_box_pack_start(GTK_BOX(app.content),root,TRUE,TRUE,0);
    GtkWidget *header=gtk_hbox_new(FALSE,8),*label=gtk_label_new(NULL);char *safe=g_markup_escape_text(title,-1),*markup=g_strdup_printf("<b>%s</b>",safe);gtk_label_set_markup(GTK_LABEL(label),markup);g_free(markup);g_free(safe);touch_font(label,22);gtk_misc_set_alignment(GTK_MISC(label),0,0.5);gtk_box_pack_start(GTK_BOX(header),label,TRUE,TRUE,6);button(header,"Close",G_CALLBACK(panel_close),NULL);gtk_box_pack_start(GTK_BOX(root),header,FALSE,FALSE,0);gtk_box_pack_start(GTK_BOX(root),gtk_hseparator_new(),FALSE,FALSE,0);
    gtk_widget_hide(app.viewport);return root;
}
static GtkWidget *scroll_box(GtkWidget *parent){
    GtkWidget *scroll=gtk_scrolled_window_new(NULL,NULL),*box=gtk_vbox_new(FALSE,10);gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(scroll),GTK_POLICY_NEVER,GTK_POLICY_AUTOMATIC);gtk_scrolled_window_add_with_viewport(GTK_SCROLLED_WINDOW(scroll),box);gtk_box_pack_start(GTK_BOX(parent),scroll,TRUE,TRUE,0);gtk_container_set_border_width(GTK_CONTAINER(box),10);return box;
}
static void heading(GtkWidget *box,const char *text){GtkWidget *label=gtk_label_new(text);touch_font(label,18);gtk_label_set_line_wrap(GTK_LABEL(label),TRUE);gtk_misc_set_alignment(GTK_MISC(label),0,0.5);gtk_box_pack_start(GTK_BOX(box),label,FALSE,FALSE,4);}
static void delete_cookies(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(!app.session || app.cookies_id)return;app.cookies_id=command("Network.clearBrowserCookies","{}",TRUE);if(app.settings_notice)gtk_label_set_text(GTK_LABEL(app.settings_notice),"Deleting cookies…");
}
typedef struct{GtkWidget *dialog,*homepage,*full_url,*search[3],*agent[2],*orientation[4],*full_orientation[4],*ui_label,*page_label,*book;int ui_scale,page_scale;} SettingsWidgets;
static void settings_free(GtkWidget *widget,gpointer data){(void)widget;g_free(data);}
static int selected_radio(GtkWidget **choices,int count){for(int i=0;i<count;++i)if(gtk_toggle_button_get_active(GTK_TOGGLE_BUTTON(choices[i])))return i;return 0;}
static void radio_group(GtkWidget *box,GtkWidget **choices,const char **names,int count,int selected){
    GSList *group=NULL;for(int i=0;i<count;++i){choices[i]=gtk_radio_button_new_with_label(group,names[i]);group=gtk_radio_button_get_group(GTK_RADIO_BUTTON(choices[i]));touch_size(choices[i],-1,56);touch_font(gtk_bin_get_child(GTK_BIN(choices[i])),18);gtk_box_pack_start(GTK_BOX(box),choices[i],FALSE,FALSE,0);}gtk_toggle_button_set_active(GTK_TOGGLE_BUTTON(choices[CLAMP(selected,0,count-1)]),TRUE);
}
static void scale_change(GtkWidget *widget,gpointer unused){
    (void)unused;SettingsWidgets *ui=g_object_get_data(G_OBJECT(widget),"settings");gboolean page=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(widget),"page"));int delta=GPOINTER_TO_INT(g_object_get_data(G_OBJECT(widget),"delta"));int *value=page?&ui->page_scale:&ui->ui_scale;*value=CLAMP(*value+delta,page?50:75,page?250:150);char text[32];g_snprintf(text,sizeof(text),"%d%%",*value);gtk_label_set_text(GTK_LABEL(page?ui->page_label:ui->ui_label),text);
}
static GtkWidget *scale_control(GtkWidget *parent,SettingsWidgets *ui,gboolean page){
    GtkWidget *row=gtk_hbox_new(FALSE,8),*label=gtk_label_new(NULL);char text[32];g_snprintf(text,sizeof(text),"%d%%",page?ui->page_scale:ui->ui_scale);gtk_label_set_text(GTK_LABEL(label),text);touch_font(label,22);
    for(int i=0;i<2;++i){GtkWidget *b=button(row,i?"+":"−",G_CALLBACK(scale_change),NULL);g_object_set_data(G_OBJECT(b),"settings",ui);g_object_set_data(G_OBJECT(b),"page",GINT_TO_POINTER(page));g_object_set_data(G_OBJECT(b),"delta",GINT_TO_POINTER(i?25:-25));if(!i)gtk_box_pack_start(GTK_BOX(row),label,TRUE,TRUE,4);}
    gtk_box_pack_start(GTK_BOX(parent),row,FALSE,FALSE,0);return label;
}
static void settings_page(GtkWidget *widget,gpointer unused){(void)unused;GtkNotebook *book=g_object_get_data(G_OBJECT(widget),"book");gtk_notebook_set_current_page(book,GPOINTER_TO_INT(g_object_get_data(G_OBJECT(widget),"page-index")));hide_keyboard(NULL,NULL);app.keyboard_target=NULL;}
static char *valid_home(const char *text){char *url=resolve_input(text,0);if(!url)return NULL;char *actual=page_url(url);if(!actual){g_free(url);url=NULL;}g_free(actual);return url;}
static void save_settings(GtkWidget *widget,gpointer data){
    (void)widget;SettingsWidgets *ui=data;char *home_url=valid_home(gtk_entry_get_text(GTK_ENTRY(ui->homepage))),*full_url=valid_home(gtk_entry_get_text(GTK_ENTRY(ui->full_url)));
    if(!home_url || !full_url){g_free(home_url);g_free(full_url);gtk_label_set_text(GTK_LABEL(app.settings_notice),"Enter a valid homepage and full-page address.");return;}
    g_free(app.homepage);app.homepage=home_url;g_free(app.full_url);app.full_url=full_url;
    app.search_engine=selected_radio(ui->search,3);int agent=selected_radio(ui->agent,2);gboolean changed=agent!=app.ua;
    app.orientation=selected_radio(ui->orientation,4);app.full_orientation=selected_radio(ui->full_orientation,4);app.ui_scale=ui->ui_scale;app.page_scale=ui->page_scale;
    save_preferences();panel_close(NULL,NULL);apply_ui_scale();rebuild_keys();dimensions(NULL);orientation_apply();
    if(changed){app.ua_next=agent;apply_user_agent(FALSE);}else if(!strcmp(app.last_url,"khromium://home"))home(NULL,NULL);
}
static void default_home(GtkWidget *widget,gpointer entry){(void)widget;gtk_entry_set_text(GTK_ENTRY(entry),"khromium://home");}
static void show_settings(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(app.settings_dialog)return;
    GtkWidget *root=panel_open("Settings");app.settings_dialog=root;
    SettingsWidgets *ui=g_new0(SettingsWidgets,1);ui->dialog=root;ui->ui_scale=app.ui_scale;ui->page_scale=app.page_scale;g_signal_connect(root,"destroy",G_CALLBACK(settings_free),ui);g_object_set_data(G_OBJECT(root),"settings",ui);
    GtkWidget *tabs=gtk_hbox_new(TRUE,5);gtk_box_pack_start(GTK_BOX(root),tabs,FALSE,FALSE,0);ui->book=gtk_notebook_new();gtk_notebook_set_show_tabs(GTK_NOTEBOOK(ui->book),FALSE);gtk_notebook_set_show_border(GTK_NOTEBOOK(ui->book),FALSE);gtk_box_pack_start(GTK_BOX(root),ui->book,TRUE,TRUE,0);
    const char *tab_names[]={"General","Display","Full Page"};GtkWidget *pages[3];
    for(int i=0;i<3;++i){GtkWidget *b=button(tabs,tab_names[i],G_CALLBACK(settings_page),NULL);g_object_set_data(G_OBJECT(b),"book",ui->book);g_object_set_data(G_OBJECT(b),"page-index",GINT_TO_POINTER(i));GtkWidget *page=gtk_vbox_new(FALSE,6);gtk_notebook_append_page(GTK_NOTEBOOK(ui->book),page,NULL);pages[i]=scroll_box(page);}
    heading(pages[0],"Homepage");ui->homepage=text_entry(app.homepage);gtk_box_pack_start(GTK_BOX(pages[0]),ui->homepage,FALSE,FALSE,0);
    GtkWidget *actions=gtk_hbox_new(TRUE,6);button(actions,"Default home",G_CALLBACK(default_home),ui->homepage);button(actions,"Delete cookies",G_CALLBACK(delete_cookies),NULL);gtk_box_pack_start(GTK_BOX(pages[0]),actions,FALSE,FALSE,0);
    const char *engines[]={"WWW (direct address)","Google","DuckDuckGo"},*agents[]={"Debian 13","Android 11"};
    heading(pages[0],"Default search");radio_group(pages[0],ui->search,engines,3,app.search_engine);heading(pages[0],"User agent");radio_group(pages[0],ui->agent,agents,2,app.ua);
    heading(pages[1],"Browser interface scale");ui->ui_label=scale_control(pages[1],ui,FALSE);heading(pages[1],"Changes toolbar, settings and keyboard size (75–150%).");
    heading(pages[1],"Page scale");ui->page_label=scale_control(pages[1],ui,TRUE);heading(pages[1],"Zooms website text and content (50–250%). Applies to both modes.");
    const char *orientations[]={"Portrait","Landscape","Portrait inverted","Landscape inverted"};heading(pages[1],"Browser orientation");radio_group(pages[1],ui->orientation,orientations,4,app.orientation);
    heading(pages[2],"Full-page URL");ui->full_url=text_entry(app.full_url);gtk_box_pack_start(GTK_BOX(pages[2]),ui->full_url,FALSE,FALSE,0);
    heading(pages[2],"Launch Full Page from KUAL. The keyboard opens on text fields. Hold the upper-left corner for 2 seconds to exit.");heading(pages[2],"Full-page orientation");radio_group(pages[2],ui->full_orientation,orientations,4,app.full_orientation);
    app.settings_notice=gtk_label_new("Changes apply when you press Save.");gtk_label_set_line_wrap(GTK_LABEL(app.settings_notice),TRUE);gtk_box_pack_start(GTK_BOX(root),app.settings_notice,FALSE,FALSE,0);
    GtkWidget *footer=gtk_hbox_new(TRUE,8);button(footer,"Save",G_CALLBACK(save_settings),ui);button(footer,"Cancel",G_CALLBACK(panel_close),NULL);gtk_box_pack_start(GTK_BOX(root),footer,FALSE,FALSE,0);
    apply_ui_scale();gtk_widget_show_all(root);
}

static gboolean window_configure(GtkWidget *widget,GdkEventConfigure *event,gpointer unused){
    (void)widget;(void)unused;gboolean landscape=event->width>event->height;if(landscape!=app.landscape){app.landscape=landscape;rebuild_keys();}return FALSE;
}

static void screen_refreshed(GPid pid,gint status,gpointer unused){
    (void)status;(void)unused;app.refresh_pid=0;g_spawn_close_pid(pid);gtk_widget_queue_draw(app.window);gtk_widget_queue_draw(app.image);app.capture_id=0;capture(NULL);
}
static void refresh_screen(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(app.refresh_pid)return;
    char *args[]={"/bin/sh","-c","eips -c > /dev/null 2>&1",NULL};
    if(g_spawn_async(NULL,args,NULL,G_SPAWN_DO_NOT_REAP_CHILD,NULL,NULL,&app.refresh_pid,NULL))g_child_watch_add(app.refresh_pid,screen_refreshed,NULL);
}
