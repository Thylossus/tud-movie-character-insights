$(document).ready(function() {
    'use strict';
    init();
    // $('#test').click(function() {
    //     var id = $(this).data('movie')
    //     $.post('/'+id, {data: 'data'}, function(result) {
    //         $('#images').html(result);
    //     });
    // })

    function init() {
        var $char = $('#character');
        var imageUrl = $char.find('a.thumbnail').data('thumbnail');
        setThumbnail($char, imageUrl);


        $char.find('#imagePath').bind('drop', function() {
            var $this = $(this);
            setTimeout(function () {
                var dragged = decodeURIComponent($this.val()).split('?')[1].split('&');
                for(var i=0; i<dragged.length; i++) {
                    if(dragged[i].startsWith('imgurl=')) {
                        var newImage = dragged[i].split('=')[1];
                        $this.val(newImage);
                        setThumbnail($char, newImage);
                    } else if(dragged[i].startsWith('imgrefurl=')) {
                        $char.find('#imageSrc').val(dragged[i].split('=')[1]);
                    }
                }

            },100);
        });

        $char.find('#btnSend').click(function() {
            var $path = $char.find('#imagePath');
            if(!$path.val() || $path.val().length == 0) {
                alert('Nichts angegeben!');
                return;
            }

            var movieId = $(this).data('movie');
            var characterId = $(this).data('character');
            var $src = $char.find('#imageSrc');
            $.post('/' + movieId, {
                character: characterId,
                image: $path.val(),
                src: $src.val()
            }, function (result) {
                $char.html(result);
            })
        })
    }

    function setThumbnail($container, url) {
        $container.find('#characterThumbnail').css('background-image', 'url("' + url + '")');
    }
});
