#define main browser_main
#include "../frontend/browser.c"
#undef main
static int phase;
static gboolean finished;
static GtkWidget *find_widget(GtkWidget *,GType,const char *);
static void press(const char *label){GtkWidget *key=find_widget(app.keyboard_rows,GTK_TYPE_BUTTON,label);g_assert(key);gtk_button_clicked(GTK_BUTTON(key));}
static void picture(const char *path){GdkWindow *win=gdk_get_default_root_window();int w,h;gdk_drawable_get_size(win,&w,&h);GdkPixbuf *pix=gdk_pixbuf_get_from_drawable(NULL,win,NULL,0,0,0,0,w,h);gdk_pixbuf_save(pix,path,"png",NULL,NULL);g_object_unref(pix);}
static GtkWidget *find_widget(GtkWidget *parent,GType type,const char *label){
 if(g_type_is_a(G_OBJECT_TYPE(parent),type) && (!label || (GTK_IS_BUTTON(parent) && !g_strcmp0(gtk_button_get_label(GTK_BUTTON(parent)),label)) || (GTK_IS_COMBO_BOX(parent) && !g_strcmp0(gtk_combo_box_get_active_text(GTK_COMBO_BOX(parent)),label))))return parent;
 if(GTK_IS_CONTAINER(parent)){GList *children=gtk_container_get_children(GTK_CONTAINER(parent));for(GList *p=children;p;p=p->next){GtkWidget *found=find_widget(p->data,type,label);if(found){g_list_free(children);return found;}}g_list_free(children);}return NULL;
}
static void evaluate(const char *expression){char *q=quote(expression),*p=g_strdup_printf("{\"expression\":%s,\"returnByValue\":true}",q);command("Runtime.evaluate",p,TRUE);g_free(q);g_free(p);}
static gboolean exercise(gpointer unused){
 (void)unused;if(!app.session || !app.page_loaded || !app.frame || app.ua_id || app.loading)return TRUE;
 switch(phase++){
 case 0:
  g_assert_cmpuint(app.favorites->len,==,2);g_assert_cmpstr(((SavedPage*)app.favorites->pdata[0])->url,==,"chromium://settings");
  picture("home.png");evaluate("JSON.stringify({test:'home',title:document.title,engine:document.querySelector('input:checked')?.value,ua:navigator.userAgent})");
  toggle_keyboard(NULL,NULL);g_assert(GTK_WIDGET_VISIBLE(app.keyboard_panel));break;
 case 1:
  g_assert(!GTK_WIDGET_VISIBLE(app.keyboard_entry));g_assert_cmpint(app.keyboard_panel->allocation.height,>=,390);picture("keyboard.png");toggle_keyboard(NULL,NULL);g_assert(!GTK_WIDGET_VISIBLE(app.keyboard_panel));
  command("Network.setCookie","{\"name\":\"khromium_test\",\"value\":\"1\",\"url\":\"https://example.test/\"}",TRUE);
  more(NULL,NULL);break;
 case 2:
  picture("menu.png");gtk_menu_popdown(GTK_MENU(app.more_menu));
  {GList *items=gtk_container_get_children(GTK_CONTAINER(app.more_menu));gboolean activated=FALSE;
   for(GList *p=items;p;p=p->next)if(!g_strcmp0(atk_object_get_name(gtk_widget_get_accessible(p->data)),"Settings")){gtk_menu_item_activate(GTK_MENU_ITEM(p->data));activated=TRUE;break;}
   g_list_free(items);g_assert(activated);}break;
 case 3:
  g_assert(app.settings_dialog);picture("settings.png");delete_cookies(NULL,NULL);
  gtk_entry_set_text(GTK_ENTRY(find_widget(app.settings_dialog,GTK_TYPE_ENTRY,NULL)),"khromium://home");
  gtk_combo_box_set_active(GTK_COMBO_BOX(find_widget(app.settings_dialog,GTK_TYPE_COMBO_BOX,"WWW (direct address)")),2);
  gtk_button_clicked(GTK_BUTTON(find_widget(app.settings_dialog,GTK_TYPE_BUTTON,"Save")));
  app.ua_next=1;apply_user_agent(FALSE);break;
 case 4:
  command("Network.getCookies","{\"urls\":[\"https://example.test/\"]}",TRUE);
  evaluate("JSON.stringify({test:'android',ua:navigator.userAgent,mobile:navigator.userAgentData.mobile})");
  navigate("chromium://dino");break;
 case 5:
  picture("dino.png");evaluate("JSON.stringify({test:'dino',canvas:!!document.querySelector('canvas'),status:document.querySelector('#status').textContent})");
  evaluate("document.querySelector('#jump').click(); 'jump clicked'");break;
 case 6:
  navigate("file:///tmp/khromium-input.html");break;
 case 7:
  app.keyboard_target=NULL;keyboard(NULL,NULL);press("h");press("Shift");press("I");press("Shift");press("ñ");press("Shift");press("Ñ");press("Shift");press("x");press("Backspace");press("Enter");break;
 case 8:
  evaluate("JSON.stringify({test:'typing',value:document.querySelector('input').value,enters:window.enters})");hide_keyboard(NULL,NULL);
  show_favorites(NULL,NULL);break;
 case 9:
  picture("favorites.png");
  GList *windows=gtk_window_list_toplevels();for(GList *p=windows;p;p=p->next){GtkWidget *save=find_widget(p->data,GTK_TYPE_BUTTON,"Save current page");if(save)gtk_button_clicked(GTK_BUTTON(save));}g_list_free(windows);
  g_assert_cmpuint(app.favorites->len,==,3);break;
 default:finished=TRUE;gtk_main_quit();return FALSE;
 }return TRUE;
}
int main(int argc,char **argv){char *u=resolve_input("hello world",0);g_assert(!u);u=resolve_input("example.org",0);g_assert_cmpstr(u,==,"https://example.org");g_free(u);u=resolve_input("hello world",2);g_assert_cmpstr(u,==,"https://duckduckgo.com/?q=hello%20world");g_free(u);g_timeout_add(2300,exercise,NULL);g_timeout_add_seconds(100,test_timeout,NULL);int result=browser_main(argc,argv);return finished?result:1;}
