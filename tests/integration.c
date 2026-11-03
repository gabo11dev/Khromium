#define main browser_main
#include "../frontend/browser.c"
#undef main
static int phase;
static gboolean finished;
static GtkWidget *find_widget(GtkWidget *root,GType type,const char *label){
 if(g_type_is_a(G_OBJECT_TYPE(root),type) && (!label || (GTK_IS_BUTTON(root) && (!g_strcmp0(gtk_button_get_label(GTK_BUTTON(root)),label) || !g_strcmp0(atk_object_get_name(gtk_widget_get_accessible(root)),label)))))return root;
 if(GTK_IS_CONTAINER(root)){GList *children=gtk_container_get_children(GTK_CONTAINER(root));for(GList *p=children;p;p=p->next){GtkWidget *found=find_widget(p->data,type,label);if(found){g_list_free(children);return found;}}g_list_free(children);}return NULL;
}
static void click(GtkWidget *root,const char *label){GtkWidget *b=find_widget(root,GTK_TYPE_BUTTON,label);g_assert(b);gtk_button_clicked(GTK_BUTTON(b));}
static void tap_toolbar(const char *label){GtkWidget *b=find_widget(app.toolbar,GTK_TYPE_BUTTON,label);g_assert(b);g_assert(gtk_test_widget_click(b,1,0));}
static void press(const char *label){click(app.keyboard_rows,label);}
static void picture(const char *path){GdkWindow *win=gdk_get_default_root_window();int w,h;gdk_drawable_get_size(win,&w,&h);GdkPixbuf *pix=gdk_pixbuf_get_from_drawable(NULL,win,NULL,0,0,0,0,w,h);gdk_pixbuf_save(pix,path,"png",NULL,NULL);g_object_unref(pix);}
static void evaluate(const char *expression){char *q=quote(expression),*p=g_strdup_printf("{\"expression\":%s,\"returnByValue\":true}",q);command("Runtime.evaluate",p,TRUE);g_free(q);g_free(p);}
static void scale_plus(GtkWidget *root,gboolean page){
 if(GTK_IS_BUTTON(root) && !g_strcmp0(gtk_button_get_label(GTK_BUTTON(root)),"+") && GPOINTER_TO_INT(g_object_get_data(G_OBJECT(root),"page"))==page){gtk_button_clicked(GTK_BUTTON(root));return;}
 if(GTK_IS_CONTAINER(root)){GList *children=gtk_container_get_children(GTK_CONTAINER(root));for(GList *p=children;p;p=p->next)scale_plus(p->data,page);g_list_free(children);}
}
static void no_popups(void){g_assert(!find_widget(app.window,GTK_TYPE_COMBO_BOX,NULL));GList *windows=gtk_window_list_toplevels();int visible=0;for(GList *p=windows;p;p=p->next)if(GTK_WIDGET_VISIBLE(p->data))++visible;g_assert_cmpint(visible,==,1);g_list_free(windows);}
static gboolean exercise(gpointer unused){
 (void)unused;if(!app.session || !app.page_loaded || !app.frame || app.ua_id || app.loading)return TRUE;
 if(app.full_page){
  switch(phase++){
   case 0:g_assert_cmpuint(app.favorites->len,==,0);g_assert(!GTK_WIDGET_VISIBLE(app.toolbar));g_assert(GTK_WIDGET_VISIBLE(app.keyboard_panel));picture("full-keyboard.png");press("ñ");break;
   case 1:evaluate("document.activeElement.blur(); 'blurred'");break;
   case 2:g_assert(!GTK_WIDGET_VISIBLE(app.keyboard_panel));picture("full-page.png");evaluate("JSON.stringify({test:'full',title:document.title,value:document.querySelector('input').value})");break;
   default:{finished=TRUE;GdkEventButton e={0};e.button=1;e.type=GDK_BUTTON_PRESS;e.x=20;e.y=20;click_page(NULL,&e,NULL);g_assert(app.hold_timer);return FALSE;}
  }return TRUE;
 }
 switch(phase++){
 case 0:
  g_assert_cmpuint(app.favorites->len,==,1);g_assert_cmpstr(((SavedPage*)app.favorites->pdata[0])->url,==,"https://example.test/keep");picture("home.png");no_popups();
  toggle_keyboard(NULL,NULL);g_assert(GTK_WIDGET_VISIBLE(app.keyboard_panel));break;
 case 1:
  g_assert(!GTK_WIDGET_VISIBLE(app.keyboard_entry));g_assert_cmpint(app.keyboard_panel->allocation.height,>=,450);picture("keyboard.png");toggle_keyboard(NULL,NULL);more(NULL,NULL);break;
 case 2:
  picture("menu.png");no_popups();click(app.panel,"Settings");break;
 case 3:{
  g_assert(app.settings_dialog);picture("settings-general.png");no_popups();
  command("Network.setCookie","{\"name\":\"khromium_test\",\"value\":\"1\",\"url\":\"https://example.test/\"}",TRUE);
  click(app.panel,"DuckDuckGo");click(app.panel,"Android 11");click(app.panel,"Delete cookies");
  SettingsWidgets *ui=g_object_get_data(G_OBJECT(app.panel),"settings");gtk_entry_set_text(GTK_ENTRY(ui->full_url),"file:///tmp/khromium-input.html");click(app.panel,"Display");scale_plus(ui->book,FALSE);scale_plus(ui->book,TRUE);scale_plus(ui->book,TRUE);click(gtk_notebook_get_nth_page(GTK_NOTEBOOK(ui->book),1),"Landscape");break;
 }
 case 4:{
  picture("settings-display.png");SettingsWidgets *ui=g_object_get_data(G_OBJECT(app.panel),"settings");click(app.panel,"Full Page");click(gtk_notebook_get_nth_page(GTK_NOTEBOOK(ui->book),2),"Landscape inverted");break;
 }
 case 5:picture("settings-full.png");click(app.panel,"Save");break;
 case 6:
  g_assert_cmpint(app.ui_scale,==,125);g_assert_cmpint(app.page_scale,==,150);g_assert_cmpint(app.orientation,==,1);g_assert_cmpint(app.full_orientation,==,3);g_assert(!app.panel);
  command("Network.getCookies","{\"urls\":[\"https://example.test/\"]}",TRUE);
  evaluate("JSON.stringify({test:'zoom',dpr:devicePixelRatio,width:innerWidth,ua:navigator.userAgent,mobile:navigator.userAgentData.mobile})");
  tap_toolbar("Refresh screen");break;
 case 7:navigate("file:///tmp/khromium-nav-a.html");break;
 case 8:navigate("file:///tmp/khromium-nav-b.html");break;
 case 9:tap_toolbar("Back");break;
 case 10:evaluate("JSON.stringify({test:'back',title:document.title,loads:window.loads})");break;
 case 11:more(NULL,NULL);tap_toolbar("Reload");break;
 case 12:g_assert(!app.panel);evaluate("JSON.stringify({test:'reload',title:document.title,loads:window.loads})");tap_toolbar("Forward");break;
 case 13:evaluate("JSON.stringify({test:'forward',title:document.title})");break;
 case 14:navigate("file:///tmp/khromium-input.html");break;
 case 15:
  g_assert(GTK_WIDGET_VISIBLE(app.keyboard_panel));press("h");press("Shift");press("I");press("Shift");press("ñ");press("Shift");press("Ñ");press("Shift");press("x");press("Backspace");press("Enter");press("←");press("→");press("↑");press("↓");break;
 case 16:
  evaluate("JSON.stringify({test:'typing',value:document.querySelector('input').value,enters:window.enters,arrows:window.arrows})");evaluate("document.activeElement.blur(); 'blurred'");break;
 case 17:
  g_assert(!GTK_WIDGET_VISIBLE(app.keyboard_panel));g_assert_cmpint(abs(gdk_pixbuf_get_height(app.frame)-app.height),<=,2);picture("keyboard-closed.png");toggle_keyboard(NULL,NULL);press("↓");break;
 case 18:
  g_assert(GTK_WIDGET_VISIBLE(app.keyboard_panel));evaluate("JSON.stringify({test:'scroll',y:scrollY})");toggle_keyboard(NULL,NULL);show_favorites(NULL,NULL);break;
 case 19:
  picture("favorites.png");click(app.panel,"Save current page");g_assert_cmpuint(app.favorites->len,==,2);panel_close(NULL,NULL);break;
 case 20:
  show_settings(NULL,NULL);click(app.panel,"Display");
  {SettingsWidgets *ui=g_object_get_data(G_OBJECT(app.panel),"settings");ui->ui_scale=150;ui->page_scale=100;click(app.panel,"Save");}gtk_window_resize(GTK_WINDOW(app.window),1448,1010);break;
 case 21:
  toggle_keyboard(NULL,NULL);break;
 case 22:
  g_assert(app.landscape);g_assert_cmpint(app.viewport->allocation.height,>=,200);picture("landscape-150.png");break;
 default:finished=TRUE;gtk_main_quit();return FALSE;
 }return TRUE;
}
int main(int argc,char **argv){g_assert_cmpstr(orientation_code(0),==,"U");g_assert_cmpstr(orientation_code(1),==,"R");g_assert_cmpstr(orientation_code(2),==,"D");g_assert_cmpstr(orientation_code(3),==,"L");g_assert(!page_url("chrome://settings"));g_assert(!page_url("chromium://settings"));g_assert(!page_url("chrome://dino"));g_assert(!page_url("chromium://dino"));char *u=resolve_input("hello world",0);g_assert(!u);g_timeout_add(2200,exercise,NULL);g_timeout_add_seconds(100,test_timeout,NULL);int result=browser_main(argc,argv);if(app.full_page)g_assert_cmpuint(app.hold_timer,==,0);return finished?result:1;}
