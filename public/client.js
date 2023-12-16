// functionally same validation functions from validation.js

const checkUsername = (name, varName) => {
  name = name.trim();
  if (name === "") throw `${varName} must not be an empty string.`;
  if (/\d/.test(name)) throw `${varName} must not contain numbers.`;
  if (name.length < 2 || name.length > 25) throw `${varName} must be between 2 and 25 characters.`;
  return name;
}

const checkEmail = (email, varName) => {
  // this email regex was created with the help of ChatGPT
  email = email.trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) throw `${varName} must be valid.`;
  return email;
}

const checkPass = (pass, varName) => {
  pass = pass.trim();
  if (pass === "") throw `${varName} must not be an empty string.`;
  if (pass.length < 8) throw `${varName} must be at least 8 characters long.`;
  if (!/\d/.test(pass)) throw `${varName} must contain at least one number.`;
  if (/\s+/.test(pass)) throw `${varName} must not contain any spaces.`;
  if (!/[A-Z]/.test(pass)) throw `${varName} must contain at least one uppercase character.`;
  if (!/[^A-Za-z0-9]/.test(pass)) throw `${varName} must contain at least one special character.`;
  return pass;
}

const confirmPass = (original, varName, confirmed) => {
  if (original.trim() !== confirmed.trim()) throw `${varName} must match.`;
  return confirmed;
}

const checkBio = (bio, varName) => {
  bio = bio.trim();
  if (bio.length < 1 || bio.length > 150) throw `${varName} must be between 1 and 150 characters.`;
  return bio;
}

const checkProfilePic = async (pfp, varName) => {
  pfp = pfp.trim();
  fs.readdir('./assets/photos', (err, files) => {
    if (err) throw `Could not read from available profile pictures... Try again soon.`;
    if (!files.includes(pfp)) throw `Please select an available option.`;
    return pfp;
  })
}

const checkString = (strVal, varName) => {
    if (typeof strVal !== 'string') throw `${varName} must be a string.`;
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw `${varName} cannot be an empty string or string with just spaces.`;
    if (!isNaN(strVal))
      throw `${strVal} cannot only contains digits.`;
    return strVal;
}

const checkRating = (intVal, varName) => {
    if (typeof intVal !== 'number') throw `${varName} must be a number.`;
    if (!Number.isInteger(intVal)) throw `${varName} must be an integer.`;
    if (intVal < 0 || intVal > 5) throw `${varName} must be a positive integer between 0 and 5.`;
    return intVal;
}

function displayError(input, message) {
	const errorMessage = `<p class="error-message">${message}</p>`;
	$(input).after(errorMessage);
}

function clearErrors() {
	$('p.'+$(this).attr('error-message')).remove();
}

// meta error checking
// TODO change so it uses hidden
// TODO change so errors say the name (update checkers ^)
function checkErrors(meta) {
	clearErrors();

	// check empty values
	let anyErrors = false;
	meta.forEach(([id, name, checker, id2]) => {
		const value = $(id).val();
		if (!value) {
			displayError(id, `${name} is required.`);
			anyMissing = true;
		}
	});

	if (anyErrors)
		return true;

	// check specific errors
	meta.forEach(([id, name, checker, id2]) => {
		const value = $(id).val();
		const value2 = id2 ? $(id2).val() : null;
		try {
			checker(value, name, value2)
		} catch (e) {
			displayError(id, e.message ?? e);
			anyErrors = true;
		};
	});

	return anyErrors;
}

// validate forms
// TODO generalize erroring and let user know which field caused the error
// TODO multiple errors
// TODO figure out where to put errors, should it just be hidden before?
// TODO attach to actual form once it is made and get correct ids

$(document).ready(function () {
	$('#music-search').keypress(function (event) {
		console.log($(this).val());
		if (event.which === 13) {
			// ignore if empty
			const searchVal = $('#music-search').val();
			if (!searchVal || searchVal.trim() === '')
				return;

			// redirect
			const query = encodeURIComponent(searchVal.trim());
			window.location.replace(`/music/search?piece=${query}`);
		}
	});

	$('#user-search').keypress(function (event) {
		if (event.which === 13) {
			// ignore if empty
			const searchVal = $('#user-search').val();
			if (!searchVal || searchVal.trim() === '')
				return;

			// redirect
			const query = encodeURIComponent(searchVal.trim());
			window.location.replace(`/users/search?user=${query}`);
		}
	});

	$('#friend-search').on('input', function (event) {
		const searchVal = $(this).val().trim().toLowerCase();

		// only show matching friends TODO fuzzy?
		$('div.friend').each(function () {
			let h5 = $(this).find('.friend-body h5')
			let name = h5.text().trim().toLowerCase();
			if (name.includes(searchVal))
				$(this).show();
			else
				$(this).hide();
			// find the h5
		});
	});


	$('#login-form').submit(function (event) {
		const meta = [
			['#emailAddressInput', 'Email Address', checkEmail],
			['#passwordInput', 'Password', checkPassword]
		];
		if (checkErrors(meta))
			event.preventDefault();
	});

	$('#registration-form').submit(function (event) {
		const meta = [
			['#usernameInput', 'Username', checkUsername],
			['#emailAddressInput', 'Email Address', checkEmail],
			['#passwordInput', 'Password', checkPassword],
			['#confirmPasswordInput', 'Confirm Password', checkConfirmPass, '#passwordInput'],
			['#bioInput', 'Bio', checkBio],
			['#profilePic', 'Profile Picture', checkProfilePic],
		];
		if (checkErrors(meta))
			event.preventDefault();
	});

	$('#music-submission-form').submit(function (event) {
		const meta = [
			['#ratingInput', 'Rating', checkRating],
			['#contentInput', 'Content', checkString]
		];
		if (checkErrors(meta))
			event.preventDefault();
	});
});