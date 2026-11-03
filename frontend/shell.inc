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
static void save_preferences(void){
    if(!app.preferences)return;
    g_key_file_set_string(app.preferences,"Browser","homepage",app.homepage);
    g_key_file_set_integer(app.preferences,"Browser","search",app.search_engine);
    g_key_file_set_integer(app.preferences,"Browser","user_agent",app.ua);
    gsize length;char *data=g_key_file_to_data(app.preferences,&length,NULL);g_file_set_contents(app.prefs_path,data,length,NULL);g_free(data);
}
static void load_state(const char *profile){
    app.prefs_path=g_build_filename(profile,"khromium.ini",NULL);app.favorites_path=g_build_filename(profile,"favorites.ini",NULL);app.visits_path=g_build_filename(profile,"history.ini",NULL);
    app.preferences=g_key_file_new();g_key_file_load_from_file(app.preferences,app.prefs_path,G_KEY_FILE_NONE,NULL);
    app.homepage=g_key_file_get_string(app.preferences,"Browser","homepage",NULL);
    if(!app.homepage || !*app.homepage || !g_utf8_validate(app.homepage,-1,NULL)){g_free(app.homepage);app.homepage=g_strdup("khromium://home");}
    app.search_engine=CLAMP(g_key_file_get_integer(app.preferences,"Browser","search",NULL),0,2);
    app.ua=CLAMP(g_key_file_get_integer(app.preferences,"Browser","user_agent",NULL),0,1);
    app.favorites=load_pages(app.favorites_path);app.visits=load_pages(app.visits_path);
    if(!g_file_test(app.favorites_path,G_FILE_TEST_EXISTS)){
        add_page(app.favorites,"Chromium Settings","chromium://settings");add_page(app.favorites,"Dino","chromium://dino");save_pages(app.favorites,app.favorites_path);
    }
}
static void record_visit(const char *url,const char *title){
    if(!url || !*url || !app.visits || !strcmp(url,"about:blank"))return;
    if(app.visits->len){SavedPage *last=g_ptr_array_index(app.visits,0);if(!strcmp(last->url,url)){g_free(last->title);last->title=g_strdup(title);save_pages(app.visits,app.visits_path);return;}}
    add_page(app.visits,title,url);
    gpointer p=app.visits->pdata[app.visits->len-1];memmove(app.visits->pdata+1,app.visits->pdata,(app.visits->len-1)*sizeof(gpointer));app.visits->pdata[0]=p;
    if(app.visits->len>100)g_ptr_array_remove_index(app.visits,100);save_pages(app.visits,app.visits_path);
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
    if(!strcmp(url,"chromium://dino") || !strcmp(url,"chrome://dino"))return asset_uri("dino.html");
    if(g_str_has_prefix(url,"https://") || g_str_has_prefix(url,"http://") || g_str_has_prefix(url,"file://") || !strcmp(url,"about:blank"))return g_strdup(url);
#ifdef BROWSER_TEST
    if(g_str_has_prefix(url,"data:"))return g_strdup(url);
#endif
    return NULL;
}
static char *visible_url(const char *url){
    char *home_uri=asset_uri("home.html"),*dino_uri=asset_uri("dino.html");char *result=g_strdup(g_str_has_prefix(url,home_uri) ? "khromium://home":g_str_has_prefix(url,dino_uri) ? "chromium://dino":url);g_free(home_uri);g_free(dino_uri);return result;
}
static void home(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;navigate(app.homepage);}
static void entry_destroyed(GtkWidget *widget,gpointer unused){(void)unused;if(app.keyboard_target==widget)app.keyboard_target=NULL;}
static GtkWidget *text_entry(const char *value){
    GtkWidget *entry=gtk_entry_new();gtk_widget_set_size_request(entry,-1,54);gtk_entry_set_text(GTK_ENTRY(entry),value ? value:"");
    g_signal_connect(entry,"button-press-event",G_CALLBACK(entry_tapped),NULL);g_signal_connect(entry,"destroy",G_CALLBACK(entry_destroyed),NULL);return entry;
}
static GtkWidget *dialog_window(const char *title,int width){
    GtkWidget *dialog=gtk_dialog_new_with_buttons(title,GTK_WINDOW(app.window),GTK_DIALOG_DESTROY_WITH_PARENT,NULL);
#ifdef KINDLE_UI
    gtk_window_set_title(GTK_WINDOW(dialog),"L:D_N:dialog_ID:org.khromium.browser_PC:T_O:U");
#endif
    gtk_window_set_modal(GTK_WINDOW(dialog),FALSE);gtk_window_set_default_size(GTK_WINDOW(dialog),width,-1);
    GtkWidget *box=gtk_dialog_get_content_area(GTK_DIALOG(dialog));gtk_container_set_border_width(GTK_CONTAINER(box),14);gtk_box_set_spacing(GTK_BOX(box),10);
    GtkWidget *heading=gtk_label_new(NULL);char *safe=g_markup_escape_text(title,-1),*markup=g_strdup_printf("<b>%s</b>",safe);gtk_label_set_markup(GTK_LABEL(heading),markup);g_free(markup);g_free(safe);gtk_box_pack_start(GTK_BOX(box),heading,FALSE,FALSE,4);
    int x=0,y=0;gtk_window_get_position(GTK_WINDOW(app.window),&x,&y);gtk_window_move(GTK_WINDOW(dialog),x+MAX(0,(app.window->allocation.width-width)/2),y+90);return dialog;
}
static void close_dialog(GtkWidget *widget,gpointer dialog){(void)widget;gtk_widget_destroy(GTK_WIDGET(dialog));}
static void settings_destroyed(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;app.settings_dialog=NULL;app.settings_notice=NULL;}
static void delete_cookies(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(!app.session || app.cookies_id)return;
    app.cookies_id=command("Network.clearBrowserCookies","{}",TRUE);
    if(app.settings_notice)gtk_label_set_text(GTK_LABEL(app.settings_notice),"Deleting cookies…");
}
typedef struct {GtkWidget *dialog,*homepage,*search,*agent;} SettingsWidgets;
static void settings_free(GtkWidget *widget,gpointer value){(void)widget;g_free(value);}
static void save_settings(GtkWidget *widget,gpointer value){
    (void)widget;SettingsWidgets *fields=value;char *url=resolve_input(gtk_entry_get_text(GTK_ENTRY(fields->homepage)),0);
    if(!url){gtk_label_set_text(GTK_LABEL(app.settings_notice),"Enter a valid homepage address.");return;}
    char *actual=page_url(url);gboolean settings_route=!strcmp(url,"chromium://settings") || !strcmp(url,"chrome://settings");
    if(!actual || settings_route){g_free(actual);g_free(url);gtk_label_set_text(GTK_LABEL(app.settings_notice),"Use the Khromium home page or an http(s) address.");return;}
    g_free(actual);g_free(app.homepage);app.homepage=url;
    app.search_engine=gtk_combo_box_get_active(GTK_COMBO_BOX(fields->search));int ua=gtk_combo_box_get_active(GTK_COMBO_BOX(fields->agent));
    gboolean changed=ua!=app.ua;save_preferences();GtkWidget *dialog=fields->dialog;
    if(changed){app.ua_next=ua;apply_user_agent(FALSE);}
    if(app.last_url && !strcmp(app.last_url,"khromium://home"))home(NULL,NULL);
    gtk_widget_destroy(dialog);hide_keyboard(NULL,NULL);
}
static void default_home(GtkWidget *widget,gpointer entry){(void)widget;gtk_entry_set_text(GTK_ENTRY(entry),"khromium://home");}
static void show_settings(GtkWidget *widget,gpointer unused){
    (void)widget;(void)unused;if(app.settings_dialog){gtk_window_present(GTK_WINDOW(app.settings_dialog));return;}
    GtkWidget *dialog=dialog_window("Settings",900);app.settings_dialog=dialog;g_signal_connect(dialog,"destroy",G_CALLBACK(settings_destroyed),NULL);
    GtkWidget *box=gtk_dialog_get_content_area(GTK_DIALOG(dialog)),*grid=gtk_table_new(3,2,FALSE);gtk_table_set_row_spacings(GTK_TABLE(grid),10);gtk_table_set_col_spacings(GTK_TABLE(grid),12);gtk_box_pack_start(GTK_BOX(box),grid,FALSE,FALSE,0);
    SettingsWidgets *fields=g_new0(SettingsWidgets,1);fields->dialog=dialog;fields->homepage=text_entry(app.homepage);
    fields->search=gtk_combo_box_new_text();const char *engines[]={"WWW (direct address)","Google","DuckDuckGo"};for(int i=0;i<3;++i)gtk_combo_box_append_text(GTK_COMBO_BOX(fields->search),engines[i]);gtk_combo_box_set_active(GTK_COMBO_BOX(fields->search),app.search_engine);
    fields->agent=gtk_combo_box_new_text();gtk_combo_box_append_text(GTK_COMBO_BOX(fields->agent),"Debian 13");gtk_combo_box_append_text(GTK_COMBO_BOX(fields->agent),"Android 11");gtk_combo_box_set_active(GTK_COMBO_BOX(fields->agent),app.ua);
    const char *labels[]={"Homepage","Default search","User agent"};GtkWidget *values[]={fields->homepage,fields->search,fields->agent};
    for(int i=0;i<3;++i){GtkWidget *label=gtk_label_new(labels[i]);gtk_misc_set_alignment(GTK_MISC(label),0,0.5);gtk_table_attach(GTK_TABLE(grid),label,0,1,i,i+1,GTK_FILL,GTK_FILL,0,0);gtk_widget_set_size_request(values[i],-1,54);gtk_table_attach(GTK_TABLE(grid),values[i],1,2,i,i+1,GTK_EXPAND|GTK_FILL,GTK_FILL,0,0);}
    GtkWidget *actions=gtk_hbox_new(FALSE,6);button(actions,"Default home",G_CALLBACK(default_home),fields->homepage);button(actions,"Delete cookies",G_CALLBACK(delete_cookies),NULL);gtk_box_pack_start(GTK_BOX(box),actions,FALSE,FALSE,0);
    app.settings_notice=gtk_label_new("Deleting cookies signs you out of websites.");gtk_label_set_line_wrap(GTK_LABEL(app.settings_notice),TRUE);gtk_box_pack_start(GTK_BOX(box),app.settings_notice,FALSE,FALSE,0);
    GtkWidget *footer=gtk_hbox_new(FALSE,8);button(footer,"Save",G_CALLBACK(save_settings),fields);button(footer,"Cancel",G_CALLBACK(close_dialog),dialog);gtk_box_pack_start(GTK_BOX(box),footer,FALSE,FALSE,0);
    g_signal_connect(dialog,"destroy",G_CALLBACK(settings_free),fields);gtk_widget_show_all(dialog);
}
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
    gtk_widget_destroy(ui->dialog);navigate(url);g_free(url);
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
    PageList *ui=g_new0(PageList,1);ui->favorites=favorites;ui->dialog=dialog_window(favorites ? "Favorites":"History",900);
    GtkWidget *box=gtk_dialog_get_content_area(GTK_DIALOG(ui->dialog)),*scroll=gtk_scrolled_window_new(NULL,NULL);gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(scroll),GTK_POLICY_NEVER,GTK_POLICY_AUTOMATIC);gtk_widget_set_size_request(scroll,-1,350);
    GtkListStore *store=gtk_list_store_new(3,G_TYPE_STRING,G_TYPE_STRING,G_TYPE_INT);ui->tree=gtk_tree_view_new_with_model(GTK_TREE_MODEL(store));g_object_unref(store);gtk_tree_view_set_headers_visible(GTK_TREE_VIEW(ui->tree),FALSE);
    GtkCellRenderer *renderer=gtk_cell_renderer_text_new();g_object_set(renderer,"ypad",12,"ellipsize",PANGO_ELLIPSIZE_END,NULL);gtk_tree_view_append_column(GTK_TREE_VIEW(ui->tree),gtk_tree_view_column_new_with_attributes("Page",renderer,"text",0,NULL));gtk_container_add(GTK_CONTAINER(scroll),ui->tree);gtk_box_pack_start(GTK_BOX(box),scroll,TRUE,TRUE,0);
    if(favorites){GtkWidget *label=gtk_label_new("Save the current page as:");gtk_box_pack_start(GTK_BOX(box),label,FALSE,FALSE,0);ui->name=text_entry(app.last_title);gtk_box_pack_start(GTK_BOX(box),ui->name,FALSE,FALSE,0);}
    GtkWidget *buttons=gtk_hbox_new(FALSE,5);button(buttons,"Open",G_CALLBACK(open_saved),ui);if(favorites)button(buttons,"Save current page",G_CALLBACK(save_current),ui);button(buttons,"Remove",G_CALLBACK(remove_saved),ui);button(buttons,"Close",G_CALLBACK(close_dialog),ui->dialog);gtk_box_pack_start(GTK_BOX(box),buttons,FALSE,FALSE,0);
    populate_pages(ui);g_signal_connect(ui->dialog,"destroy",G_CALLBACK(list_destroyed),ui);gtk_widget_show_all(ui->dialog);
}
static void show_favorites(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;show_page_list(TRUE);}
static void show_history(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;show_page_list(FALSE);}
static void menu_position(GtkMenu *menu,int *x,int *y,gboolean *push,gpointer unused){
    (void)unused;GtkRequisition req;gtk_widget_size_request(GTK_WIDGET(menu),&req);int wx,wy;gtk_window_get_position(GTK_WINDOW(app.window),&wx,&wy);*x=wx+app.window->allocation.width-req.width-10;*y=wy+70;*push=TRUE;
}
static void more(GtkWidget *widget,gpointer unused){(void)widget;(void)unused;gtk_menu_popup(GTK_MENU(app.more_menu),NULL,NULL,menu_position,NULL,0,gtk_get_current_event_time());}
enum {ICON_HOME,ICON_BACK,ICON_RELOAD,ICON_FORWARD,ICON_KEYBOARD,ICON_MORE,ICON_EXIT};
static gboolean draw_icon(GtkWidget *widget,GdkEventExpose *event,gpointer kind){
    (void)event;cairo_t *c=gdk_cairo_create(widget->window);double x=(widget->allocation.width-32)/2.0,y=(widget->allocation.height-32)/2.0;cairo_translate(c,x,y);cairo_set_source_rgb(c,0,0,0);cairo_set_line_width(c,2.4);cairo_set_line_cap(c,CAIRO_LINE_CAP_ROUND);cairo_set_line_join(c,CAIRO_LINE_JOIN_ROUND);
    switch(GPOINTER_TO_INT(kind)){
    case ICON_HOME:cairo_move_to(c,3,15);cairo_line_to(c,16,4);cairo_line_to(c,29,15);cairo_move_to(c,7,13);cairo_line_to(c,7,28);cairo_line_to(c,13,28);cairo_line_to(c,13,20);cairo_line_to(c,20,20);cairo_line_to(c,20,28);cairo_line_to(c,26,28);cairo_line_to(c,26,13);break;
    case ICON_BACK:case ICON_FORWARD:{gboolean forward=GPOINTER_TO_INT(kind)==ICON_FORWARD;if(forward){cairo_translate(c,32,0);cairo_scale(c,-1,1);}cairo_move_to(c,26,16);cairo_line_to(c,5,16);cairo_line_to(c,14,7);cairo_move_to(c,5,16);cairo_line_to(c,14,25);break;}
    case ICON_RELOAD:cairo_arc(c,16,16,11,0.1,5.1);cairo_move_to(c,21,3);cairo_line_to(c,22,11);cairo_line_to(c,29,8);break;
    case ICON_KEYBOARD:cairo_rectangle(c,2,7,28,20);for(int row=0;row<2;++row)for(int column=0;column<5;++column){cairo_move_to(c,6+column*5,12+row*5);cairo_line_to(c,7+column*5,12+row*5);}cairo_move_to(c,10,23);cairo_line_to(c,22,23);break;
    case ICON_MORE:for(int i=0;i<3;++i){cairo_arc(c,16,7+i*9,1.8,0,6.29);cairo_fill(c);}break;
    case ICON_EXIT:cairo_move_to(c,7,7);cairo_line_to(c,25,25);cairo_move_to(c,25,7);cairo_line_to(c,7,25);break;
    }cairo_stroke(c);cairo_destroy(c);return FALSE;
}
static GtkWidget *icon_button(GtkWidget *row,const char *name,int icon,GCallback callback,gpointer value){
    GtkWidget *b=gtk_button_new(),*drawing=gtk_drawing_area_new();gtk_button_set_relief(GTK_BUTTON(b),GTK_RELIEF_NONE);gtk_widget_set_size_request(b,62,66);gtk_button_set_focus_on_click(GTK_BUTTON(b),FALSE);gtk_container_add(GTK_CONTAINER(b),drawing);gtk_widget_set_tooltip_text(b,name);atk_object_set_name(gtk_widget_get_accessible(b),name);gtk_box_pack_start(GTK_BOX(row),b,FALSE,FALSE,0);g_signal_connect(drawing,"expose-event",G_CALLBACK(draw_icon),GINT_TO_POINTER(icon));g_signal_connect(b,"clicked",callback,value);return b;
}
static void build_window(void){
    app.window=gtk_window_new(GTK_WINDOW_TOPLEVEL);gtk_window_set_title(GTK_WINDOW(app.window),"Khromium Alpha 0.0.1");
#ifdef KINDLE_UI
    gtk_window_set_title(GTK_WINDOW(app.window),"L:A_N:application_PC:T_ID:org.khromium.browser_O:U");gtk_window_set_decorated(GTK_WINDOW(app.window),FALSE);
#endif
    gtk_window_set_default_size(GTK_WINDOW(app.window),1072,1360);
    GtkWidget *box=gtk_vbox_new(FALSE,0),*bar=gtk_hbox_new(FALSE,1);gtk_container_add(GTK_CONTAINER(app.window),box);gtk_box_pack_start(GTK_BOX(box),bar,FALSE,FALSE,0);
    icon_button(bar,"Home",ICON_HOME,G_CALLBACK(home),NULL);icon_button(bar,"Back",ICON_BACK,G_CALLBACK(history),GINT_TO_POINTER(-1));icon_button(bar,"Reload",ICON_RELOAD,G_CALLBACK(reload_page),NULL);icon_button(bar,"Forward",ICON_FORWARD,G_CALLBACK(history),GINT_TO_POINTER(1));
    app.address=text_entry("");gtk_box_pack_start(GTK_BOX(bar),app.address,TRUE,TRUE,0);gtk_widget_set_tooltip_text(app.address,"Search or enter address");atk_object_set_name(gtk_widget_get_accessible(app.address),"Search or enter address");
    icon_button(bar,"Keyboard",ICON_KEYBOARD,G_CALLBACK(toggle_keyboard),NULL);icon_button(bar,"More",ICON_MORE,G_CALLBACK(more),NULL);icon_button(bar,"Exit",ICON_EXIT,G_CALLBACK(quit),NULL);
    gtk_box_pack_start(GTK_BOX(box),gtk_hseparator_new(),FALSE,FALSE,0);
    app.more_menu=gtk_menu_new();const char *names[]={"History","Favorites","Settings"};GCallback callbacks[]={G_CALLBACK(show_history),G_CALLBACK(show_favorites),G_CALLBACK(show_settings)};
    for(int i=0;i<3;++i){GtkWidget *item=gtk_menu_item_new_with_label(names[i]);gtk_widget_set_size_request(item,260,64);gtk_menu_shell_append(GTK_MENU_SHELL(app.more_menu),item);g_signal_connect(item,"activate",callbacks[i],NULL);}gtk_widget_show_all(app.more_menu);
    app.status=gtk_label_new("Starting Khromium…");gtk_widget_set_size_request(app.status,-1,36);gtk_box_pack_start(GTK_BOX(box),app.status,FALSE,FALSE,0);
    app.viewport=gtk_event_box_new();app.image=gtk_drawing_area_new();gtk_widget_set_size_request(app.viewport,320,200);gtk_container_add(GTK_CONTAINER(app.viewport),app.image);gtk_box_pack_start(GTK_BOX(box),app.viewport,TRUE,TRUE,0);g_signal_connect(app.image,"expose-event",G_CALLBACK(draw_page),NULL);
    app.keyboard_panel=gtk_vbox_new(FALSE,2);GtkWidget *heading=gtk_hbox_new(FALSE,4);app.keyboard_title=gtk_label_new("Keyboard");gtk_box_pack_start(GTK_BOX(heading),app.keyboard_title,TRUE,TRUE,0);app.keyboard_clear=button(heading,"Clear",G_CALLBACK(keyboard_key),NULL);button(heading,"Hide",G_CALLBACK(hide_keyboard),NULL);gtk_box_pack_start(GTK_BOX(app.keyboard_panel),heading,FALSE,FALSE,0);
    app.keyboard_entry=gtk_entry_new();gtk_editable_set_editable(GTK_EDITABLE(app.keyboard_entry),FALSE);gtk_box_pack_start(GTK_BOX(app.keyboard_panel),app.keyboard_entry,FALSE,FALSE,0);app.keyboard_rows=gtk_vbox_new(FALSE,2);gtk_box_pack_start(GTK_BOX(app.keyboard_panel),app.keyboard_rows,FALSE,FALSE,0);rebuild_keys();gtk_box_pack_end(GTK_BOX(box),app.keyboard_panel,FALSE,FALSE,0);
    gtk_widget_add_events(app.viewport,GDK_BUTTON_PRESS_MASK|GDK_BUTTON_RELEASE_MASK|GDK_SCROLL_MASK);g_signal_connect(app.viewport,"button-press-event",G_CALLBACK(click_page),NULL);g_signal_connect(app.viewport,"button-release-event",G_CALLBACK(click_page),NULL);g_signal_connect(app.viewport,"scroll-event",G_CALLBACK(scroll_event),NULL);g_signal_connect(app.viewport,"size-allocate",G_CALLBACK(resize_page),NULL);g_signal_connect(app.address,"activate",G_CALLBACK(open_address),NULL);g_signal_connect(app.window,"destroy",G_CALLBACK(quit),NULL);
    gtk_widget_show_all(app.window);gtk_widget_hide(app.keyboard_panel);
}
