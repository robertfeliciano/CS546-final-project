
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

// error functions

function displayError(input, message) {
	const errorMessage = `<p class="error-message">${message}</p>`;
	$(input).after(errorMessage);
}

function clearErrors() {
	$('.error-message').remove();
}

// validate forms

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
		// TODO multiple errors, might have to rewrite checking functions
		try {
			checkEmail(email);
			checkPass(password);
		} catch (e) {
			event.preventDefault();
			// TODO figure out where to put errors, should it just be hidden before?
			displayError('#passwordInput', e.message ?? e);
		}
	}
});
