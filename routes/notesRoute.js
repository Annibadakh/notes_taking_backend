const express = require("express");
const authenticate = require('../middleware/authMiddleware');
const {createNote, getNotes, getNoteById, updateNote, deleteNote, toggleArchiveNote, togglePinNote, getNoteStats} = require("../controllers/noteController");


const router = express.Router();


router.post("/create", authenticate, createNote);
router.get("/get-notes", authenticate, getNotes);
router.get("/getnote/:id", authenticate, getNoteById);
router.put("/save/:id", authenticate, updateNote);
router.delete("/delete-note/:id", authenticate, deleteNote);

router.get('/stats', authenticate, getNoteStats);

router.patch('/:id/archive', authenticate, toggleArchiveNote);
router.patch('/:id/pin', authenticate, togglePinNote);


module.exports = router;