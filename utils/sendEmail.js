const nodemailer = require('nodemailer');
const fs = require('fs');
const config = require('config');
const handlebars = require('handlebars');

// getting mailkeys from config
const mailKey = config.get("email");

const mailer = async (name, email, orderId) => {
    const transporter = nodemailer.createTransport({
      host: `${mailKey.host}`,
      port: 465,
      secure: true,
      auth: {
        user: `${mailKey.user}`,
        pass: `${mailKey.password}`,
      },
    })

    const emailTemp = fs.readFileSync(
        "emailTemplates/orderEmail.html", "utf8"  //connecting the html email Template
    )

    const template = handlebars.compile(emailTemp)

    const replacements = {
        name: name,
        orderId: orderId
    }

    const emailHtml = template(replacements)

    const mailOptions = {
      from: `${mailKey.user}`,
      bcc: "taiwoolugbenga1992@gmail.com",
      to: email,
      subject: "Your Order is pending",
      html: emailHtml
    };


    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Email could not be sent", err)
        } else {
            console.log("Email sent successfully");
        }
    })

}

module.exports = mailer