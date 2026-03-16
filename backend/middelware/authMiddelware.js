import jwt from "jsonwebtoken";
export const authMiddelware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};
