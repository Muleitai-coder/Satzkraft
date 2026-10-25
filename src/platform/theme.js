(function(){
 try{
  var saved=localStorage.getItem("training-theme-v1");
  document.documentElement.dataset.theme=saved||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
 }catch(e){document.documentElement.dataset.theme="dark";}
})();
