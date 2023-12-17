$(document).ready(function () {
    // console.log("GOT HERE!!!")
    let postButton = $('#post-form'),
    allPosts = $('#feed'),
    content = $('#content'),
    rating = $('#rating')

		let pfp = $('.profile-photo img').attr('src');

    postButton.submit(function (event) {
        // console.log("GOT HERE TOO!!!")
        event.preventDefault();

        let newContent = content.val();
        let newRating = rating.val();

				console.log(newContent, newRating);
        if (newContent && newRating) {
            let requestConfig = {
                method: 'POST',
                url: window.location.href,
                contentType: 'application/json',
                data: JSON.stringify({
                    content: newContent,
                    rating: newRating
                })
            } 
            $.ajax(requestConfig).then(function (responseMessage) {
                let postEl = `<div class="post-1" onclick="redirectToPost(${responseMessage._id})">
                <div class="top">
                    <div class="user">
												<div class="profile-photo">
													<img src="${pfp}" alt="profile-picture">
												</div>
                        <div class="info">
                            <h3><a href="/users/${responseMessage.user_id}">${responseMessage.username}</a></h3>
                            <small>${responseMessage.date}</small>
                        </div>
    
                    </div>
                </div>
                <div class="content">
                    <p>
                        ${responseMessage.content}
                    </p>
                </div>
                <div class="rating">
                    <h4>Rating: ${responseMessage.rating}/5</h4>
                </div>
                <div class="interaction-buttons">
                    <span><i class="uil uil-heart"></i></span>
                    <span><i class="uil uil-comment-alt"></i></span>
                </div>
            </div>`
                allPosts.prepend(postEl)
                content.val('');
                rating.val('');
                content.focus();
            })
        }
        return false;
    })
});

