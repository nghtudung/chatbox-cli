// emojiMap-loader.js
fetch('emoji.json')
  .then(response => response.json())
  .then(data => {
    const extendedEmojiMap = {};

    for (const item of data) {
      // Chuyển "grinning face" → ":grinning_face:"
      const key = ':' + item.name.toLowerCase().replace(/ /g, '_') + ':';
      if (!emojiMap.hasOwnProperty(key)) {
        extendedEmojiMap[key] = item.char;
      }
    }

    // Gộp thêm vào emojiMap thủ công
    Object.assign(emojiMap, extendedEmojiMap);
    console.log('[emojiMap] merged, total:', Object.keys(emojiMap).length);
  })
  .catch(err => {
    console.error('Failed to load emoji.json:', err);
  });
