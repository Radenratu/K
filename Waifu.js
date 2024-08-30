const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "waifu",
    aliases: ["w"],
    version: "2.0",
    author: "edinst",
    countDown: 25,
    role: 0,
    shortDescription: {
      en: "games"
    },
    longDescription: {
      en: "waifu pull to get a random card \n/waifu sell (cardid)/all to sell a card\n/waifu info \n/waifu show (cardid)"
    },
    category: "games",
    guide: {
      en: ""
    }
  },
  onStart: async function ({ api, event, usersData, args, message }) {
    try {
      const command = args[0];

      if (command === 'pull') {
        const uid = event.senderID;
        let userName;

        try {
        } catch (error) {
          console.error('Error fetching profile info:', error);
          userName = 'Unknown User';
        }

        const apiResponse = await axios.get('https://reflective-deeply-brand.glitch.me/');
        const waifuArray = apiResponse.data;

        let totalPossibility = 0;
        for (const waifuData of waifuArray) {
          totalPossibility += parseFloat(waifuData.possibility);
        }

        const randomNumber = Math.random() * totalPossibility;

        let selectedWaifu;

        for (const waifuData of waifuArray) {
          totalPossibility -= parseFloat(waifuData.possibility);
          if (randomNumber >= totalPossibility) {
            selectedWaifu = waifuData;
            break;
          }
        }

        if (!selectedWaifu) {
          selectedWaifu = waifuArray[Math.floor(Math.random() * waifuArray.length)];
        }

        const waifuName = selectedWaifu.waifuname;
        const img = selectedWaifu.link;
        const stars = selectedWaifu.stars;
        const price = selectedWaifu.price;
        const waifuid = selectedWaifu.waifuid;

        const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
        let waifuDataArray = JSON.parse(waifuJSON);


        // Jika pengguna belum memiliki 10 waifu di halaman 1, tambahkan ke halaman 1
        if (waifusOnPage1.length < 3) {
          waifuDataArray.push({
            uid: uid,
            name: userName,
            waifuName: waifuName,
            stars: stars,
            link: img,
            price: price,
            waifuid: waifuid,
            page: 1
          });
        } else {
          // Jika pengguna sudah memiliki 10 waifu di halaman 1, tambahkan ke halaman berikutnya
          let lastPageNumber = 1;
          for (const waifu of waifuDataArray) {
            if (waifu.uid === uid && waifu.page > lastPageNumber) {
              lastPageNumber = waifu.page;
            }
          }
          waifuDataArray.push({
            uid: uid,
            name: userName,
            waifuName: waifuName,
            stars: stars,
            link: img,
            price: price,
            waifuid: waifuid,
            page: newPageNumber
          });
        }

        fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');

        if (userData.money >= 50) {
          usersData.set(uid, {
            money: userData.money - 50,
            data: userData.data
          });

          await message.reply({
            body: `• 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘂𝗹𝗮𝘁𝗶𝗼𝗻𝘀!: ${userName}\n• 𝗖𝗵𝗮𝗿𝗮𝗰𝘁𝗲𝗿 𝗡𝗮𝗺𝗲: ${waifuName}\n• 𝗖𝗵𝗮𝗿𝗮𝗰𝘁𝗲𝗿 𝗜𝗗: ${waifuid}\n• 𝗧𝗶𝗻𝗴𝗸𝗮𝘁 𝗞𝗮𝗿𝘁𝘂 : ${stars}\n• 𝗛𝗮𝗿𝗴𝗮 𝗣𝗮𝘀𝗮𝗿: ${price}`,
            attachment: await global.utils.getStreamFromURL(img)
          }, event.threadID);
        } else {
          await message.reply("kamu butuh 50$ untuk mendapatkan kartu.", event.threadID);
        }
      } else if (command === 'bulk') {
        const quantity = parseInt(args[1]);

        if (isNaN(quantity) || quantity < 1 || quantity > 3) {
          return message.reply("Please specify a quantity between 1 and 3.");
        }

        const uid = event.senderID;
        let userName;

        try {
          const profileInfo = await api.getUserInfo(uid);
          const userData = profileInfo[uid];
          userName = userData.name;
        } catch (error) {
          console.error('Error fetching profile info:', error);
          userName = 'Unknown User';
        }

        const apiResponse = await axios.get('https://reflective-deeply-brand.glitch.me/');
        const waifuArray = apiResponse.data;

        let totalPossibility = 0;
        for (const waifuData of waifuArray) {
          totalPossibility += parseFloat(waifuData.possibility);
        }

        const waifuDataArray = [];
        const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
        const waifuDataArrayExisting = JSON.parse(waifuJSON);
        const waifusOnPage1 = waifuDataArrayExisting.filter(waifu => waifu.uid === uid && waifu.page === 1);

        for (let i = 0; i < quantity; i++) {
          const randomNumber = Math.random() * totalPossibility;

          let selectedWaifu;

          for (const waifuData of waifuArray) {
            totalPossibility -= parseFloat(waifuData.possibility);
            if (randomNumber >= totalPossibility) {
              selectedWaifu = waifuData;
              break;
            }
          }

          if (!selectedWaifu) {
            selectedWaifu = waifuArray[Math.floor(Math.random() * waifuArray.length)];
          }

          const waifuName = selectedWaifu.waifuname;
          const price = selectedWaifu.price;
          const waifuid = selectedWaifu.waifuid;
          const stars = selectedWaifu.stars;

          let page = 1;

          if (waifusOnPage1.length >= 3) {
            // Jika pengguna sudah memiliki 10 waifu di halaman 1, tambahkan ke halaman berikutnya
            const existingPages = new Set(waifuDataArrayExisting.filter(waifu => waifu.uid === uid).map(waifu => waifu.page));
            let nextPage = 2;
            while (existingPages.has(nextPage)) {
              nextPage++;
            }
            page = nextPage;
          }

          waifuDataArray.push({
            uid: uid,
            name: userName,
            waifuName: waifuName,
            price: price,
            waifuid: waifuid,
            stars: stars,
            page: page
          });

          // Deduct money from user's balance
          const userData = await usersData.get(uid);
          if (userData.money >= 50) {
            usersData.set(uid, {
              money: userData.money - 50,
              data: userData.data
            });
          } else {
            return message.reply("You need 50₩ for each card in the bulk pull.", event.threadID);
          }
        }

        // Menggabungkan semua data waifu menjadi satu pesan
        let bulkMessage = '';
        waifuDataArray.forEach((waifu, index) => {
          bulkMessage += `#${waifu.waifuid} ${waifu.waifuName} (${waifu.stars})\n`;
        });
        const ms = `# 𝗕𝘂𝗹𝗸 𝗚𝗮𝗰𝗵𝗮'𝘀\n\n${bulkMessage}`

        // Menyimpan data waifu ke dalam waifu.json
        const waifuDataArrayUpdated = waifuDataArrayExisting.concat(waifuDataArray);
        fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArrayUpdated), 'utf8');

        return message.reply(ms);
}
 else if (command === 'sell') {
  const waifuid = args[1];

  if (waifuid.toLowerCase() === 'all') {
    // Sell all waifus
    const waifuDataArray = JSON.parse(fs.readFileSync('waifu.json', 'utf8'));
    const userWaifus = waifuDataArray.filter(waifu => waifu.uid === event.senderID);

    if (userWaifus.length === 0) {
      return message.reply("Kamu tidak memiliki kartu untuk dijual");
    }

    let totalEarnings = 0;

    for (const waifu of userWaifus) {
      totalEarnings += waifu.price * 1; // Multiply by the number of waifus being sold (1 in this case)
    }

    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    usersData.set(senderID, {
      money: userData.money + totalEarnings,
      data: userData.data
    });

    // Clear user's waifu collection
    const updatedWaifuDataArray = waifuDataArray.filter(waifu => waifu.uid !== event.senderID);
    fs.writeFileSync('waifu.json', JSON.stringify(updatedWaifuDataArray), 'utf8');

    return message.reply(`Kamu berhasil menjual semua item harga ${totalEarnings} won!.`);
  } else {
    // Sell a specific waifu
    const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
    let waifuDataArray = JSON.parse(waifuJSON);

    const selectedWaifu = waifuDataArray.find(waifu => waifu.waifuid === waifuid && waifu.uid === event.senderID);

    if (!selectedWaifu) {
      return message.reply(`Kamu tidak memiliki kartu ID ${waifuid}!`);
    }

    const waifuPrice = parseInt(selectedWaifu.price);

    // Add money to user's balance
    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    usersData.set(senderID, {
      money: userData.money + waifuPrice,
      data: userData.data
    });

    // Remove waifu from collection
    waifuDataArray = waifuDataArray.filter(waifu => waifu.waifuid !== waifuid || waifu.uid !== event.senderID);
    fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');

    return message.reply(`Kamu menjual item ID ${waifuid} harga ${waifuPrice}$!`);
}
} else if (command === 'info') {
        const infoMessage =`# 𝗚𝗮𝗰𝗵𝗮 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻\n • Waifu Card\n____________________\n• (𝗥𝗮𝘁𝗲)\n_____________________\n𝗥: 98%\n𝗦𝗥: 25%\n𝗦𝗦𝗥: 2%\n_____________________\n•  (𝗠𝗮𝗿𝗸𝗲𝘁 𝗣𝗹𝗮𝗰𝗲)\n_____________________\n𝗥: 25€\n𝗦𝗥: 53€\n𝗦𝗦𝗥: 60€\n____________________`;

        return message.reply(infoMessage, event.threadID);

} else if (command === 'inv') {
  const uid = event.senderID;
  const page = parseInt(args[1]) || 1;

  if (!page) {
    message.reply('masuka nomor halaman.', event.threadID);
    return;
  }

  const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
  const waifuDataArray = JSON.parse(waifuJSON);

  const userWaifusOnPage = waifuDataArray.filter(waifu => waifu.uid === uid && waifu.page === parseInt(page));

  if (userWaifusOnPage.length === 0) {
    message.reply(`Kamu tidak memiliki item di page ${page}.`, event.threadID);
    return;
  }

let response = '# 𝗜𝘁𝗲𝗺 𝗧𝗲𝗿𝗸𝗼𝗹𝗲𝗸𝘀𝗶:';
  userWaifusOnPage.forEach((waifu, index) => {
    response += `\n\n`;
    response += `𝗖𝗮𝗿𝗱 𝗡𝗮𝗺𝗲: ${waifu.waifuName}\n𝗜𝗗 𝗖𝗮𝗿𝗱: ${waifu.waifuid}\n• ${waifu.stars}`;
  });
     const msg = `${response}`;

  message.reply(msg, event.threadID);
}

else if (command === 'show') {
  const waifuidToShow = args[1];

  const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
  const waifuDataArray = JSON.parse(waifuJSON);

  const selectedWaifu = waifuDataArray.find(waifu => waifu.waifuid === waifuidToShow && waifu.uid === event.senderID);

  if (!selectedWaifu) {
    return message.reply(`No waifu found with the ID ${waifuidToShow}.`);
  } else {
    const waifuInfoMessage = `𝗡𝗮𝗺𝗲 : ${selectedWaifu.waifuName}\n• ${selectedWaifu.stars}`;

    const imageStream = await global.utils.getStreamFromURL(selectedWaifu.link);
    return message.reply({
      body: waifuInfoMessage,
      attachment: imageStream,
    }, event.threadID);
  }
}
 else {
        return message.reply("Invalid command \ncommand: \nblc pull \nblc sell (cardid)/all \nblc info \nblc show (cardid)\nblc bulk (page)\n\nOld license by: edi nst II");
    } 
} catch (error) {
      console.error(error);
    }
  }
};
