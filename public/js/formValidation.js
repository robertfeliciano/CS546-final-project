
// copied validation functions from validation.js

const checkUsername = (name) => {
  if (name === undefined) throw `Must provide input for username`;
  name = name.trim();
  if (name === "") throw `Username must not be an empty string.`;
  if (/\d/.test(name)) throw `Username must not contain numbers.`;
  if (name.length < 2 || name.length > 25) throw `Username must be between 2 and 25 characters.`;
  return name;
}

const checkEmail = (email) => {
  if (email === undefined) throw `Must provide input for email`;
  // this email regex was created with the help of ChatGPT
  email = email.trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) throw `Not a valid email address.`;
  return email;
}

const checkPass = (pass) => {
  if (pass === undefined) throw `Must provide input for password`;
  pass = pass.trim();
  if (pass === "") throw `Password must not be an empty string.`;
  if (pass.length < 8) throw `Password must be at least 8 characters long.`;
  if (!/\d/.test(pass)) throw `Password must contain at least one number.`;
  if (/\s+/.test(pass)) throw `Password must not contain any spaces.`;
  if (!/[A-Z]/.test(pass)) throw `Password must contain at least one uppercase character.`;
  let special = /[^A-Za-z0-9]/
  if (!special.test(pass)) throw `Password must contain at least one special character.`;
  return pass;
}

const confirmPass = (original, confirmed) => {
  if (original.trim() !== confirmed.trim()) throw `Passwords must match.`;
  return confirmed;
}

export const checkBio = (bio) => {
  bio = bio.trim();
  if (bio.length < 1 || bio.length > 150) throw `Bio must be between 1 and 150 characters!`;
  return bio;
}

export const checkProfilePic = async (pfp) => {
  pfp = pfp.trim();
  fs.readdir('./assets/photos', (err, files) => {
    if (err) throw `Could not read from available profile pictures... Try again soon!`;
    if (!files.includes(pfp)) throw `Please select an available option!`;
    return pfp;
  })
}

export const checkString = (strVal, varName) => {
    if (!strVal) throw `Error: You must supply a ${varName}!`;
    if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw `Error: ${varName} cannot be an empty string or string with just spaces`;
    if (!isNaN(strVal))
      throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
    return strVal;
}

export const checkRating = (intVal, varName) => {
    if (!intVal) throw `Error: You must supply a ${varName}!`;
    if (typeof intVal !== 'number') throw `Error: ${varName} must be a number!`;
    if (!Number.isInteger(intVal)) throw `Error: ${varName} must be an integer!`;
    if (intVal < 0 || intVal > 5) throw `Error: ${varName} must be a positive integer between 0 and 5!`;
    return intVal;
}

// error functions

function displayError(input, message) {
	const errorMessage = `<p class="error-message">${message}</p>`;
	$(input).after(errorMessage);
}

function clearErrors() {
	$('.error-message').remove();
}

// validate forms
// TODO generalize erroring and let user know which field caused the error
// TODO multiple errors
// TODO figure out where to put errors, should it just be hidden before?

$(document).ready(function () {
	// TODO attach to actual form once it is made and get correct ids
	$('#login-form').submit(function (event)) {
		const email = $('#emailAddressInput').val();
		const password = $('#passwordInput').val();
		clearErrors();

		// check for missing fields
		let missingFields = [];
		if (!email) missingFields.push('Email Address');
		if (!password) missingFields.push('Password');

		if (missingFields.length > 0) {
			event.preventDefault();
			displayError('#passwordInput', `Missing field(s): ${missingFields.join(', ')}`);
		}
		
		// check for specific validity
		try {
			checkEmail(email);
			checkPass(password);
		} catch (e) {
			event.preventDefault();
			displayError('#passwordInput', e.message ?? e);
		}
	}

	$('#registration-form').submit(function (event)) {
		const username = $('usernameInput').val();
		const email = $('#emailAddressInput').val();
		const password = $('#passwordInput').val();
		const password2 = $('#confirmPasswordInput').val();
		const bio = $('bioInput').val();
		const profilePicture = $('profilePictureInput').val();
		clearErrors();

		// check for missing fields
		let missingFields = [];
    if (!username) missingFields.push('Username');
    if (!emailAddress) missingFields.push('Email Address');
    if (!password) missingFields.push('Password');
    if (!password2) missingFields.push('Confirm Password');
    if (!bio) missingFields.push('Bio');
    if (!profilePicture) missingFields.push('Profile Picture');
		
		if (missingFields.length > 0) {
			event.preventDefault();
			displayError('#passwordInput', `Missing field(s): ${missingFields.join(', ')}`);
		}

		// check for specific validity
		try {
			checkUsername(user);
			checkEmail(email);
			checkPass(password);
			checkConfirmPass(password, password2);
			checkBio(bio);
			checkProfilePic(profilePicture);
		} catch (e) {
			event.preventDefault();
			displayError('#profilePictureInput', e.message ?? e);
		}
	}

	$('#music-submission-form').submit(function (event)) {
		const rating = $('#ratingInput').val();
		const content = $('#contentInput').val();
		clearErrors();

		// check for missing fields
		let missingFields = [];
		if (!rating) missingFields.push('Rating');
		if (!content) missingFields.push('Content');

		if (missingFields.length > 0) {
			event.preventDefault();
			displayError('#contentInput', `Missing field(s): ${missingFields.join(', ')}`);
		}
		
		// check for specific validity
		try {
			checkRating(rating);
			checkString(content);
		} catch (e) {
			event.preventDefault();
			displayError('#contentInput', e.message ?? e);
		}
	}
});
