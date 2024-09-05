const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const fs = require('fs');

module.exports = {
    config: {
        name: "waifu",
        aliases: ["waifu"],
        version: "1",
        author: "Edinst",
        countDown: 25,
        role: 0,
        description: { en: "Permainan gacha untuk kartu waifu." },
        category: "games",
        guide: {
            en: {
                "pull": "Tarik kartu waifu secara acak.",
                "bulk": "Tarik beberapa kartu waifu sekaligus.",
                "sell": "Jual kartu waifu tertentu atau semua kartu.",
                "info": "Tampilkan informasi tentang permainan gacha.",
                "inv": "Tampilkan inventaris kartu waifu Anda.",
                "show": "Tampilkan detail dari kartu waifu tertentu."
            }
        }
    },

    langs: {
        en: {
            "pull_success": "• Selamat!: {userName}\n• Nama Karakter: {waifuName}\n• ID Karakter: {waifuid}\n• Bintang: {stars}\n• Harga: {price}",
            "bulk_success": "# Gacha Tarik (Bulk)\n\n{bulkMessage}",
            "sell_success_all": "Anda berhasil menjual semua item seharga {totalEarnings} won!",
            "sell_success_single": "Anda menjual item ID {waifuid} seharga {price} won!",
            "sell_no_cards": "Anda tidak memiliki kartu untuk dijual.",
            "sell_no_card": "Anda tidak memiliki kartu dengan ID {waifuid}!",
            "pull_no_money": "Anda memerlukan 20 dolar untuk menarik kartu.",
            "bulk_no_money": "Uang tidak mencukupi untuk tarik bulk.",
            "info_message": "# Informasi Gacha\n• Tingkat Kartu\n____________________\nR: 98%\nSR: 25%\nSSR: 2%\n____________________\n• Harga Pasar\n____________________\nR: 25€\nSR: 53€\nSSR: 60€\n____________________",
            "inv_no_items": "Anda tidak memiliki item di halaman {page}.",
            "show_no_card": "Tidak ada waifu dengan ID {waifuid}.",
            "invalid_command": "Perintah tidak valid. Perintah:\n/waifu pull\n/waifu sell (cardid)/all\n/waifu info\n/waifu show (cardid)\n/waifu bulk (jumlah)\n\nLisensi lama oleh: edi nst II"
        }
    },

    onStart: async function ({ message, api, event }) {
        try {
            const [command, arg1] = message.args;
            const uid = event.senderID;
            let userName;

            try {
                const profileInfo = await api.getUserInfo(uid);
                userName = profileInfo[uid]?.name || 'Pengguna Tidak Dikenal';
            } catch (error) {
                console.error('Error fetching profile info:', error);
                userName = 'Pengguna Tidak Dikenal';
            }

            const apiResponse = await axios.get('https://gacha-api.onrender.com/');
            const waifuArray = apiResponse.data;
            let totalPossibility = waifuArray.reduce((acc, waifu) => acc + parseFloat(waifu.possibility), 0);

            function getRandomWaifu() {
                const randomNumber = Math.random() * totalPossibility;
                let selectedWaifu;
                for (const waifuData of waifuArray) {
                    totalPossibility -= parseFloat(waifuData.possibility);
                    if (randomNumber >= totalPossibility) {
                        selectedWaifu = waifuData;
                        break;
                    }
                }
                return selectedWaifu || waifuArray[Math.floor(Math.random() * waifuArray.length)];
            }

            const waifuJSON = fs.readFileSync('waifu.json', 'utf8');
            let waifuDataArray = JSON.parse(waifuJSON);

            switch (command) {
                case 'pull': {
                    if ((await usersData.get(uid)).money < 20) {
                        return message.reply(this.langs.en.pull_no_money, event.threadID);
                    }
                    const selectedWaifu = getRandomWaifu();
                    const { waifuname: waifuName, link: img, stars, price, waifuid } = selectedWaifu;
                    const waifusOnPage1 = waifuDataArray.filter(w => w.uid === uid && w.page === 1);
                    const newPageNumber = waifusOnPage1.length < 3 ? 1 : Math.max(...waifuDataArray.filter(w => w.uid === uid).map(w => w.page)) + 1;
                    waifuDataArray.push({ uid, name: userName, waifuName, stars, link: img, price, waifuid, page: newPageNumber });
                    fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');
                    await usersData.set(uid, { money: (await usersData.get(uid)).money - 10, data: (await usersData.get(uid)).data });
                    return message.reply({ body: this.langs.id.pull_success.replace("{userName}", userName).replace("{waifuName}", waifuName).replace("{waifuid}", waifuid).replace("{stars}", stars).replace("{price}", price), attachment: await global.utils.getStreamFromURL(img) }, event.threadID);
                }
                case 'bulk': {
                    const quantity = parseInt(arg1);
                    if (isNaN(quantity) || quantity < 1 || quantity > 10) {
                        return message.reply("Tentukan jumlah antara 1 dan 10.");
                    }
                    if ((await usersData.get(uid)).money < (10 * quantity)) {
                        return message.reply(this.langs.en.bulk_no_money, event.threadID);
                    }

                    const waifuDataArrayToAdd = [];
                    for (let i = 0; i < quantity; i++) {
                        const selectedWaifu = getRandomWaifu();
                        const { waifuname: waifuName, price, waifuid, stars } = selectedWaifu;
                        const waifusOnPage1 = waifuDataArray.filter(w => w.uid === uid && w.page === 1);
                        let page = waifusOnPage1.length >= 3 ? Math.max(...waifuDataArray.filter(w => w.uid === uid).map(w => w.page)) + 1 : 1;
                        waifuDataArrayToAdd.push({ uid, name: userName, waifuName, price, waifuid, stars, page });
                    }

                    waifuDataArray = waifuDataArray.concat(waifuDataArrayToAdd);
                    fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');
                    await usersData.set(uid, { money: (await usersData.get(uid)).money - (10 * quantity), data: (await usersData.get(uid)).data });

                    let bulkMessage = '';
                    waifuDataArrayToAdd.forEach(waifu => {
                        bulkMessage += `• Nama Karakter: ${waifu.waifuName}\n• ID Karakter: ${waifu.waifuid}\n• Bintang: ${waifu.stars}\n• Harga: ${waifu.price}\n\n`;
                    });
                    return message.reply(this.langs.en.bulk_success.replace("{bulkMessage}", bulkMessage), event.threadID);
                }
                case 'sell': {
                    const cardId = arg1 === 'all' ? null : parseInt(arg1);
                    const userData = await usersData.get(uid);
                    if (!cardId) {
                        if (waifuDataArray.filter(w => w.uid === uid).length === 0) {
                            return message.reply(this.langs.en.sell_no_cards, event.threadID);
                        }
                        const totalEarnings = waifuDataArray.filter(w => w.uid === uid).reduce((total, w) => total + w.price, 0);
                        waifuDataArray = waifuDataArray.filter(w => w.uid !== uid);
                        fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');
                        await usersData.set(uid, { money: userData.money + totalEarnings, data: userData.data });
                        return message.reply(this.langs.en.sell_success_all.replace("{totalEarnings}", totalEarnings), event.threadID);
                    }
                    const cardIndex = waifuDataArray.findIndex(w => w.uid === uid && w.waifuid === cardId);
                    if (cardIndex === -1) {
                        return message.reply(this.langs.en.sell_no_card.replace("{waifuid}", cardId), event.threadID);
                    }
                    const card = waifuDataArray.splice(cardIndex, 1)[0];
                    fs.writeFileSync('waifu.json', JSON.stringify(waifuDataArray), 'utf8');
                    await usersData.set(uid, { money: userData.money + card.price, data: userData.data });
                    return message.reply(this.langs.en.sell_success_single.replace("{waifuid}", cardId).replace("{price}", card.price), event.threadID);
                }
                case 'info': {
                    return message.reply(this.langs.en.info_message, event.threadID);
                }
                                case 'inv': {
                    const page = parseInt(arg1) || 1;
                    const userCards = waifuDataArray.filter(w => w.uid === uid && w.page === page);
                    if (userCards.length === 0) {
                        return message.reply(this.langs.en.inv_no_items.replace("{page}", page), event.threadID);
                    }
                    let inventoryMessage = `# Inventaris Kartu (Halaman ${page})\n\n`;
                    userCards.forEach(card => {
                        inventoryMessage += `• Nama Karakter: ${card.waifuName}\n• ID Karakter: ${card.waifuid}\n• Bintang: ${card.stars}\n• Harga: ${card.price}\n\n`;
                    });
                    return message.reply(inventoryMessage, event.threadID);
                }
                case 'show': {
                    const cardId = parseInt(arg1);
                    const card = waifuDataArray.find(w => w.uid === uid && w.waifuid === cardId);
                    if (!card) {
                        return message.reply(this.langs.en.show_no_card.replace("{waifuid}", cardId), event.threadID);
                    }
                    return message.reply({
                        body: `• Nama Karakter: ${card.waifuName}\n• ID Karakter: ${card.waifuid}\n• Bintang: ${card.stars}\n• Harga: ${card.price}`,
                        attachment: await global.utils.getStreamFromURL(card.link)
                    }, event.threadID);
                }
                default:
                    return message.reply(this.langs.en.invalid_command, event.threadID);
            }
        } catch (error) {
            console.error('Error:', error);
            message.reply('Terjadi kesalahan saat memproses perintah.', event.threadID);
        }
    }
};
