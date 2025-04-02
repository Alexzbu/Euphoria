import dotenv from 'dotenv'
dotenv.config()

export default Object.freeze({
   databaseName: process.env.DATABASE_NAME,
   databaseUrl: process.env.MONGODB_URL,
   mongoURI: `${process.env.MONGODB_URL}${process.env.DATABASE_NAME}`,
   sessionSecret: process.env.SESSION_SECRET,
   cookieSecret: process.env.COOKIE_SECRET,
   tokenSecret: process.env.TOKEN_SECRET,
   port: process.env.PORT,
})