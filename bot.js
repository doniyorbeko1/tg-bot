const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const token = process.env.8698364994:AAFZNoMTzFzVMFoTKQRrWyR1xfsX3pWP9_Y;

const bot = new TelegramBot(token, {
    polling: true
});

bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "Salom");
});

app.get("/", (req, res) => {
    res.send("Bot ishlayapti");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

// ======================
// KARTALAR
// ======================

const cards = [
    {
        number: '6262 5700 7941 9950',
        owner: 'Ganiyev G'
    },
    {
        number: '4073 4200 4305 2962',
        owner: 'Mamajonov M'
    },
];


// ======================
// USER STATES
// ======================

const userStates = {};


// ======================
// MENU
// ======================

function mainMenu(chatId) {

    bot.sendMessage(chatId,
        'Kerakli bo‘limni tanlang:',
        {
            reply_markup: {
                keyboard: [
                    ['💳 Hisobni to‘ldirish'],
                    ['💸 Pul yechish'],
                    ['🛠 Support']
                ],
                resize_keyboard: true
            }
        }
    );

}


// ======================
// START
// ======================

bot.onText(/\/start/, (msg) => {

    userStates[msg.chat.id] = {};

    bot.sendMessage(msg.chat.id,
        'Assalomu alaykum!'
    );

    mainMenu(msg.chat.id);

});


// ======================
// MESSAGE HANDLER
// ======================

bot.on('message', async (msg) => {

    const chatId = msg.chat.id;

    if (msg.text === '/start') return;

    if (chatId == adminId) return;

    if (!userStates[chatId]) {
        userStates[chatId] = {};
    }

    const state = userStates[chatId];


// ======================
// MAIN MENU
// ======================

    if (msg.text === '💳 Hisobni to‘ldirish') {

        state.step = 'deposit_id';

        return bot.sendMessage(chatId,
`1xBet ID raqamingizni yuboring.

⚠️ Diqqat:
ID raqamni noto‘g‘ri yuborsangiz, mablag‘ boshqa hisobga tushib ketishi mumkin.`,
        {
            reply_markup: {
                keyboard: [
                    ['🔙 Asosiy menyu']
                ],
                resize_keyboard: true
            }
        });

    }


    if (msg.text === '💸 Pul yechish') {

        state.step = 'withdraw_screenshot';

        return bot.sendMessage(chatId,
`1xBet platformasida pul chiqarish bo‘limiga kiring.

🏦 Nalichniye (1xBet logosi bilan)

📍 Shahar:
Chust

📍 Manzil:
ZEUS (24/7)

⚠️ Muhim:
Kassada berilgan maxsus kod screenshotda ko‘rinishi shart.

Screenshotni yuboring.`,
        {
            reply_markup: {
                keyboard: [
                    ['🔙 Asosiy menyu']
                ],
                resize_keyboard: true
            }
        });

    }


    if (msg.text === '🛠 Support') {

        state.step = 'support';

        return bot.sendMessage(chatId,
`Muammo yoki savolingizni yozib yuboring.

Operator tez orada siz bilan bog‘lanadi.`,
        {
            reply_markup: {
                keyboard: [
                    ['📞 Operator kontakti'],
                    ['🔙 Asosiy menyu']
                ],
                resize_keyboard: true
            }
        });

    }


// ======================
// BACK BUTTON
// ======================

    if (msg.text === '🔙 Asosiy menyu') {

        userStates[chatId] = {};

        return mainMenu(chatId);

    }


// ======================
// SUPPORT CONTACT
// ======================

    if (msg.text === '📞 Operator kontakti') {

        return bot.sendMessage(chatId,
            'Operator: @Kassa_1xbt'
        );

    }


// ======================
// DEPOSIT FLOW
// ======================

    if (state.step === 'deposit_id') {

        state.betId = msg.text;
        state.step = 'deposit_amount';

        return bot.sendMessage(chatId,
            'To‘ldirmoqchi bo‘lgan summani kiriting.'
        );

    }


    if (state.step === 'deposit_amount') {

        state.amount = msg.text;
        state.step = 'deposit_screenshot';

        const randomCard =
            cards[Math.floor(Math.random() * cards.length)];

        state.card = randomCard;

        return bot.sendMessage(chatId,
`To‘lov uchun karta:

💳 ${randomCard.number}
👤 ${randomCard.owner}

To‘lov qilgandan so‘ng screenshot yuboring.`
        );

    }


    if (state.step === 'deposit_screenshot') {

        if (!msg.photo) {

            return bot.sendMessage(chatId,
                'Iltimos screenshot yuboring.'
            );

        }

        const photoId =
            msg.photo[msg.photo.length - 1].file_id;

        const buttons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '✅ Tasdiqlash',
                            callback_data: `approveDeposit_${chatId}`
                        },
                        {
                            text: '❌ Bekor qilish',
                            callback_data: `rejectDeposit_${chatId}`
                        }
                    ]
                ]
            }
        };
        console.log("ADMIN ID:", adminId);
        console.log("USER ID:", chatId);
        console.log("PHOTO ID:", photoId);

        bot.sendPhoto(adminId,
            photoId,
            {
                caption:
`📥 Yangi to‘lov

👤 ${msg.from.first_name}
🆔 ${chatId}

🎮 1xBet ID:
${state.betId}

💰 Summa:
${state.amount}

💳 Karta:
${state.card.number}`,
                reply_markup: buttons.reply_markup
            });

        userStates[chatId] = {};

        return bot.sendMessage(chatId,
`⏳ Screenshot qabul qilindi.

Operator tekshirib bo'lgach hisobingiz to‘ldiriladi.`
        );

    }


// ======================
// WITHDRAW FLOW
// ======================

    if (state.step === 'withdraw_screenshot') {

        if (!msg.photo) {

            return bot.sendMessage(chatId,
                'Iltimos screenshot yuboring.'
            );

        }

        state.withdrawPhoto =
            msg.photo[msg.photo.length - 1].file_id;

        state.step = 'withdraw_card';

        return bot.sendMessage(chatId,
`Karta raqamingizni yuboring.

⚠️ Diqqat:
Karta raqamni noto‘g‘ri yuborsangiz, mablag‘ boshqa kartaga tushib ketishi mumkin.`
        );

    }


    if (state.step === 'withdraw_card') {

        state.cardNumber = msg.text;

        const buttons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '✅ To‘landi',
                            callback_data: `approveWithdraw_${chatId}`
                        },
                        {
                            text: '❌ Bekor qilish',
                            callback_data: `rejectWithdraw_${chatId}`
                        }
                    ]
                ]
            }
        };

        bot.sendPhoto(adminId,
            state.withdrawPhoto,
            {
                caption:
`💸 Pul yechish so‘rovi

👤 ${msg.from.first_name}
🆔 ${chatId}

💳 Karta:
${state.cardNumber}`,
                reply_markup: buttons.reply_markup
            });

        userStates[chatId] = {};

        return bot.sendMessage(chatId,
`⏳ So‘rovingiz qabul qilindi.

Tasdiqlangandan so‘ng 5–10 daqiqa ichida mablag‘ kartangizga tushadi.`
        );

    }


// ======================
// SUPPORT FLOW
// ======================

    if (state.step === 'support') {

        bot.sendMessage(adminId,
`🛠 Support murojaati

👤 ${msg.from.first_name}
🆔 ${chatId}

✉️ Xabar:
${msg.text}`);

        return bot.sendMessage(chatId,
            '✅ Xabaringiz operatorga yuborildi.'
        );

    }

});


// ======================
// CALLBACKS
// ======================

bot.on('callback_query', async (query) => {

    const data = query.data;


// ======================
// DEPOSIT APPROVE
// ======================

    if (data.startsWith('approveDeposit_')) {

        const userId = data.split('_')[1];

        bot.sendMessage(userId,
            '✅ Hisobingiz muvaffaqiyatli to‘ldirildi.'
        );

        bot.answerCallbackQuery(query.id,
            { text: 'Tasdiqlandi' });

    }


// ======================
// DEPOSIT REJECT
// ======================

    if (data.startsWith('rejectDeposit_')) {

        const userId = data.split('_')[1];

        bot.sendMessage(userId,
            '❌ To‘lov tasdiqlanmadi.'
        );

        bot.answerCallbackQuery(query.id,
            { text: 'Bekor qilindi' });

    }


// ======================
// WITHDRAW APPROVE
// ======================

    if (data.startsWith('approveWithdraw_')) {

        const userId = data.split('_')[1];

        bot.sendMessage(userId,
            '✅ Kartangizga pul muvaffaqiyatli yuborildi.'
        );

        bot.answerCallbackQuery(query.id,
            { text: 'To‘landi' });

    }


// ======================
// WITHDRAW REJECT
// ======================

    if (data.startsWith('rejectWithdraw_')) {

        const userId = data.split('_')[1];

        bot.sendMessage(userId,
            '❌ So‘rov bekor qilindi. Pul kassamizga yechilmagan yoki kod noto‘g‘ri bo‘lishi mumkin!'
        );

        bot.answerCallbackQuery(query.id,
            { text: 'Bekor qilindi' });

    }

});
