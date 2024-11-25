const express = require("express");
require("express-group-routes");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.group("/auth", (route) => {
  route.post("/login", authController.login);
  route.post("/verify", authController.verify);
});

router.group("/user", (route) => {
  route.get("/messages/:contactId", authMiddleware, userController.getMessages);
  route.get("/contacts", authMiddleware, userController.getContacts);

  route.post("/message", authMiddleware, userController.createMessage);
  route.post("/reaction", authMiddleware, userController.createReaction);
  route.post("/contact", authMiddleware, userController.createContact);
  route.post("/send-otp", authMiddleware, userController.sendOtp);
  route.post("/read-messages", authMiddleware, userController.readMessages);

  route.put(
    "/message/:messageId",
    authMiddleware,
    userController.updateMessage,
  );

  route.put("/profile", authMiddleware, userController.updateProfile);
  route.put("/email", authMiddleware, userController.updateEmail);

  route.delete(
    "/message/:messageId",
    authMiddleware,
    userController.deleteMessage,
  );
  route.delete("/delete", authMiddleware, userController.deleteUser);
});

module.exports = router;
