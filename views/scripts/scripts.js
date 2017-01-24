$( document ).ready(function() {
    var i = 2;
    $("#add").on('click', function(){

       $("#option" + i).after(
           '<div id="option'+ (i+1)+ '">' +
           '<label for="option'+ (i+1) + '">Option  ' + (i+1) + ':</label>' +
            '<input class="form-control" id="optionText' + (i+1) + '" name="option' + (i+1) + '" type="text">' +
            '</div>'
           );
        i++
    });
    
    $('#remove').on('click', function(){
        if(i == 2){
            
            }
        else {
        
            $('#option' + i).remove();
            i--;
        }
    });
    
    
    if($("#messages").length > 0){
        // wait 1.5 sec to add fade out for flash messages.
        setTimeout(function(){
        $("#messages").addClass('animated fadeOut');
        //detect animation end.
        $("#messages").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
            //on animation end remove messages div.
            $("#messages").hide();
            
        });
        }, 1500)
        
        
    }
    // twitter widget
    window.twttr = (function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0],
    t = window.twttr || {};
  if (d.getElementById(id)) return t;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);

  t._e = [];
  t.ready = function(f) {
    t._e.push(f);
  };

  return t;
}(document, "script", "twitter-wjs"));
    
   
});