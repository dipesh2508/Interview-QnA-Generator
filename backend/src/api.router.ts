import { Router } from "express";
import authRouter from "@/routers/auth.routes";
import userRouter from "@/routers/user.routes";
import interviewRouter from "@/routers/interview.routes";
import mockSessionRouter from "@/routers/mock-session.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/interviews", interviewRouter);
apiRouter.use("/mock-sessions", mockSessionRouter);

export default apiRouter;
