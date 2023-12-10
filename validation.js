// input validation functions to be used in routes/* and data/*

import fs from 'fs';
import {ObjectId} from "mongodb";

export const checkUsername = (name) => {
  if (name === undefined) throw `Must provide input for username`;
  name = name.trim();
  if (name === "") throw `Username must not be an empty string.`;
  if (/\d/.test(name)) throw `Username must not contain numbers.`;
  if (name.length < 2 || name.length > 25) throw `Username must be between 2 and 25 characters.`;
  return name;
}


export const checkEmail = (email) => {
  if (email === undefined) throw `Must provide input for email`;
  // this email regex was created with the help of ChatGPT
  email = email.trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) throw `Not a valid email address.`;
  return email;
}

export const checkPass = (pass) => {
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

export const confirmPass = (original, confirmed) => {
  confirmed = confirmed.trim();
  if (original !== confirmed) throw `Passwords must match.`;
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

export const checkId = (id, type) => {
  if (!id) throw `You must provide an id to search for. ${type}`;
  if (typeof id !== 'string') throw `Id must be a string for ${type}`;
  if (id.trim().length === 0) throw `Id cannot be an empty string or just spaces for ${type}`;

  id = id.trim();
  if (!ObjectId.isValid(id)) throw `invalid object ID for ${type}`;

  return id;
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