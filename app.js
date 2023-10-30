// ENVIRONMENT VARIABLES CONFIGURATION
const dotenv = require('dotenv');
dotenv.config({
  path: './config.env'
});
const UserModel = require("./models/User_m")
const RegisteredEventsModel = require("./models/registered_events_m")
const CartModel = require("./models/cart_m")
// MODULES & IMPORTS
const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require('mongoose');
const paymentDetails = require('./controllers/pa.controller')
const { ApolloServer } = require("@apollo/server")
const { expressMiddleware } = require("@apollo/server/express4")
// const CryptoJS = require('crypto-js');
const cors = require('cors');

app.use(cors());
const slackInteraction = require("./controllers/slack.controller.js");
// var cors = require("cors");
// var session = require("express-session");
// var nodemailer = require("nodemailer");
// var cookieparser = require("cookie-parser");
// var axios = require("axios");
// var randomstring = require("randomstring");
// const SessionStore = require('express-session-sequelize')(session.Store);
// var https = require('https');
// const checksum_lib = require('./Paytm/checksum/checksum.js');

// app.use(cors({
//   origin:[
//     "https://localhost:4200",
//     "http://localhost:4200",
//     "https://fmcweekend.in",
//     "http://fmcweekend.in"
//   ],//frontend server localhost:8080
//   methods:['GET','POST','PUT','DELETE'],
//   credentials: true // enable set cookie
//  }));
//Express-session
// app.use(cookieparser("FMC is love, FMC is life"));
// app.use(
//   session({
//     secret: "FMC is love, FMC is life",
//     proxy: true,
//     httpOnly : false,
//     resave: true,
//     secure: true,
//     saveUninitialized: true,
//     store: models.sequelizeSessionStore,
//     cookie : {
//       secure: true,
//       httpOnly: false,
//     }
//     // store: MongoStore.create({
//     //   mongoUrl:
//     //     "mongodb://gmail_auth:gmail_auth@fmc-shard-00-00.fsipp.mongodb.net:27017,fmc-shard-00-01.fsipp.mongodb.net:27017,fmc-shard-00-02.fsipp.mongodb.net:27017/fmcweek?ssl=true&replicaSet=fmc-shard-0&authSource=admin&retryWrites=true&w=majority",
//     // }),
//   })
// );
// app.use(cors(corsOptions));

const { loginFunc, logoutFunc, verifyToken } = require('./services/googleAuth');

// MIDDLEWARE
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(methodOverride('_method'));
app.use(express.static('.'));


// CORS
// app.use(function (req, res, next) {
//   const allowedOrigins = [
//     "https://localhost:4200",
//     "https://localhost:5500",
//     "http://localhost:4200",
//     "https://fmcweekend.in",
//     "http://fmcweekend.in",
//     "https:\/\/(?:.+.)?.herokuapp.com\/"
//   ];
//   // res.setHeader("Access-Control-Allow-Origin", "*");
//   const origin = req.headers.origin;
//   res.setHeader("Access-Control-Allow-Origin", origin || '*');
//   // if (allowedOrigins.includes(origin)) {
//   //   res.setHeader("Access-Control-Allow-Origin", origin);
//   // }
//   // Website you wish to allow to connect
//   // res.setHeader('Access-Control-Allow-Origin', 'https://fmcmerch.herokuapp.com');
//   // res.setHeader('Access-Control-Allow-Origin', 'https://localhost:5500');
//   // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5500');

//   // Request methods you wish to allow
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );

//   // Request headers you wish to allow
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader("Access-Control-Allow-Credentials", true);

//   // Pass to next layer of middleware
//   next();
// });

//ROUTERS
const rout = require('./routers/index.router.js');
const eventrout = require('./routers/event.router.js');
const registerrout = require('./routers/register.router.js');
const leaderrout = require('./routers/leader.router.js');
const userrout = require('./routers/user.router');
const cartrout = require('./routers/cart.router');
const paymentrout = require('./services/instamojoPayment');
const contactrout = require("./routers/contact.router")
const registeredeventsrout = require("./routers/registeredEvents.router")
// const parout = require('./routers/pa.router');

const mailrout = require('./routers/mail.router');



// ROUTES
app.get('/api/test', (req, res) => {
  slackInteraction.slackInteraction("#cron-job", `Server Pinged by ${req.ip}`);
  // console.log(req)
  res.status(200).json({ message: 'API Running successfully' });
})
app.post("/api/google-login", loginFunc);
app.post("/api/verify-token", verifyToken);
app.post('/api/logout', logoutFunc);
app.use('/api', rout);
app.use('/api', eventrout);
app.use('/api', registerrout);
app.use('/api', leaderrout);
app.use('/api', userrout);
app.use('/api', cartrout);
app.use('/api', paymentrout);
app.use('/api', mailrout);
app.use('/api', contactrout)
app.use('/api', registeredeventsrout)
// app.use('/api', parout);


// const decrypted = CryptoJS.AES.decrypt(encrypted, "Message").toString(CryptoJS.enc.Utf8);
// DATABASE CONNECTION
// const DB = process.env.local_mongo;

const DB = process.env.DATABASE;
console.log(DB)
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  slackInteraction.slackInteraction("#server", `Successfully connected to database with ` + DB);
  console.log('Successfully connected to database');
}).catch((err) => {
  console.log('There was some error connecting to the database');
  console.log(err);
})


async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs: `
      type User {
        email: String!
        name: String!
        role: Int!
        number: String
        yearOfStudy: Int
        instaHandle: String
        college: String
        userCart: Cart
        userRegisteredEvents: RegisteredEvents
      }
      type Cart {
        forUser: String!
        cartItems: [CartItem!]!
      }
      type CartItem {
        id: Int!
        img: String!
        genre: String!
        Type: String!
        title: String!
        special: String!
        link: String!
        price: Int!
        prize: String!
        color: String!
        color2: String!
        content: String!
        time: String!
        date: String!
        desc: String!
        name: String!
        img1: String!
        img2: String!
        price1: Int!
        price2: Int!
        payment: Payment!
        verifyStatus: Boolean!
        transactionID: String!
      }
      type Payment {
        status: Int!
        paymentID: String!
        paymentRequestID: String!
      }
      type RegisteredEvents {
        forUser: String!
        registeredEvents: [Event]
        verified: Boolean
        ver: [Verification]
      }
      type Event {
       
        id: Int
        name: String
       
      }
      
      type Verification {
       
        id: Int
        status: Boolean
      
      }
      type Query {
        users: [User!]!
        carts: [Cart!]!
        registeredEvents: [RegisteredEvents!]!
      }
    `,
    resolvers: {
      Query: {
        users: async () => {
          try {
            // const users = await UserModel.find({});
            // console.log(users)
            return await UserModel.find({});
          } catch (err) {
            return "error"
          }

        },
        carts: async () => {
          return await CartModel.find({});
        },
        registeredEvents: async () => {
          return await RegisteredEventsModel.find({});
        },
      },
    },
  });
  await server.start();
  app.use("/graphql", expressMiddleware(server));
  app.all('*', (req, res) => {
    res.status(404).json({
      message: 'Given route does not exist'
    })
  })
  // Assuming app and slackInteraction are defined and imported elsewhere in your application.
  app.listen(process.env.PORT || 8000, function (err, result) {
    console.log(`Server is running at port! ${process.env.PORT}`);
    slackInteraction.slackInteraction("#server", `Server is running at port! ${process.env.PORT}`);
  });
}
startApolloServer();



