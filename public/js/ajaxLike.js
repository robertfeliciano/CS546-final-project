$(document).ready(function ($) {
    updateButtonState();
    $('#likeButton').on('click', function () {
        let isLiked = $('#likeButton').find('.likeIcon').children().attr('id') === 'heart-fill';
        if (isLiked) {
            return
        }
        let route = '/posts/'
        let currentUrl = window.location.pathname
        let postId = currentUrl.split('/').pop()
        //the pop grabs the id of the post that we're looking at
        let requestConfig = {
            method: 'PATCH',
            url: `${route}${postId}`
        };
        $.ajax(requestConfig).then(function () {
            updateButtonState()
        })
    })

    function updateButtonState() {
        let isLiked = $('#likeButton').find('.likeIcon').children().attr('id') === 'heart-fill';
        let newId = isLiked ? 'heart' : 'heart-fill';
        $('#likeButton').find('.likeIcon').children().attr('id', newId);
    }
})(window.jQuery);