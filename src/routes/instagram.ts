import express, { Request, Response } from "express";
import { getFollowersWithLogin } from "../service/instagram";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const data = await getFollowersWithLogin(username, password);

    return res.status(200).json({ data });
});

export default router;