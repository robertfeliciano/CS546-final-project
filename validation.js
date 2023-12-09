// input validation functions to be used in routes/* and data/*

const exportedMethods = {
  checkName(name, which) {
    if (name === undefined) throw `Must provide input for ${which}`;
    name = name.trim();
    if (name === "") throw `${which} must not be an empty string.`;
    if (/\d/.test(name)) throw `${which} must not contain numbers.`;
    if (name.length < 2 || name.length > 25) throw `${which} must be between 2 and 25 characters.`;
    return name;
  },


  checkEmail(email){
    if (email === undefined) throw `Must provide input for email`;
    // this email regex was created with the help of ChatGPT
    email = email.trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) throw `Not a valid email address.`;
    return email;
  },

  checkPass(pass) {
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
  },

  confirmPass(original, confirmed){
    confirmed = confirmed.trim();
    if (original !== confirmed) throw `Passwords must match.`;
    return confirmed;
  },

  checkRole(role){
    if (role === undefined) throw `Must provide input for role`;
    role = role.toLowerCase();
    if (role !== "admin" && role !== "user") throw `Role can only be 'admin' or 'user'.`;
    return role;
  },
};


export default exportedMethods;