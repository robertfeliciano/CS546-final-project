(function ($) {
    updateButtonState();
    $('#likeButton').on('click', function () {
        let isLiked = $('#likeButton').text() === 'Liked'
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
        let buttonText = $('#likeButton').text()
        let isLiked = buttonText === 'Liked'

        $('#likeButton').text(isLiked ? 'Liked' : 'Like')
    }
})(window.jQuery);