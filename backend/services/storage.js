const fs = require('fs');
const supabase = require('../config/supabase');

/**
 * Uploads a local file to Supabase Storage and deletes the local temp file.
 * @param {string} filePath - Absolute path to local file.
 * @param {string} filename - Filename to store in Supabase.
 * @param {string} mimetype - MIME type of the file.
 * @returns {Promise<any>}
 */
async function uploadFile(filePath, filename, mimetype) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('BPCIT_STUDENT')
      .upload(filename, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Delete the local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return data;
  } catch (err) {
    console.error('Error uploading file to Supabase:', err);
    // Attempt local cleanup anyway
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    throw err;
  }
}

/**
 * Deletes a file from Supabase Storage.
 * @param {string} filename - Filename to remove.
 * @returns {Promise<void>}
 */
async function deleteFile(filename) {
  if (!filename) return;
  try {
    const { error } = await supabase.storage
      .from('BPCIT_STUDENT')
      .remove([filename]);

    if (error) {
      console.error('Error deleting file from Supabase Storage:', error);
    }
  } catch (err) {
    console.error('Exception deleting file from Supabase:', err);
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
