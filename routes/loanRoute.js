import express from "express";
import verifyToken from "../middleware/isAuth.js";
import {
  loanRequest,
  loanApprove,
  loanDecline,
  termRepayment,
  findPendingLoans,
  getAllPendingLoans,
  getApprovedLoans,
  getLoanRepayments,
  getPaidLoans,
  getDeclinedLoans,
} from "../controllers/loanController.js";

const router = express.Router();

router.post("/request", verifyToken, loanRequest);
router.put("/approve", verifyToken, loanApprove);

router.put("/decline", verifyToken, loanDecline);
router.put("/repayment", verifyToken, termRepayment);

router.get("/pending", verifyToken, findPendingLoans);
router.get("/allPending", verifyToken, getAllPendingLoans);
router.get("/approved", verifyToken, getApprovedLoans);
router.get("/declined", verifyToken, getDeclinedLoans);
router.get("/paid", verifyToken, getPaidLoans);
router.get("/repayment/:loanId", verifyToken, getLoanRepayments);

export default router;
