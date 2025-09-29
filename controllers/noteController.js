const {Note, sequelize} = require("../models");
const { Op } = require("sequelize");

const getWordCount = (htmlContent) => {
  if (!htmlContent) return 0;
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
};

const getCharacterCount = (htmlContent) => {
  if (!htmlContent) return 0;
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  return textContent.length;
};

const getPlainMeta = (meta) => {
  if (!meta) return {};
  if (typeof meta === 'object' && meta !== null) {
    try {
      return typeof meta === 'string' ? JSON.parse(meta) : JSON.parse(JSON.stringify(meta));
    } catch (e) {
      return {};
    }
  }
  return {};
};

const createNote = async (req, res) => {
  try {
    const { title, content = "", meta = {}} = req.body;
    const userId = req.user.uuid;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    const characterCount = getCharacterCount(content);
    const wordCount = getWordCount(content);
    // console.log(characterCount, wordCount, "/////////")

    const noteMeta = {
      characterCount,
      wordCount,
      lastModified: new Date().toISOString(),
      fontColor: meta.fontColor || '#000000',
      ...meta
    };

    const note = await Note.create({
      title: title.trim(),
      content,
      meta: noteMeta,
      userId
    });

    // console.log(note, "stored ////////////////////")

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note
    });

  } catch (error) {
    console.error("Create note error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getNotes = async (req, res) => {
  try {
    const userId = req.user.uuid;
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      archived = false,
      pinned 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = {
      userId,
      isArchived: archived === 'true'
    };

    if (pinned !== undefined) {
      whereConditions.isPinned = pinned === 'true';
    }

    if (search.trim()) {
      whereConditions[Op.or] = [
        {
          title: {
            [Op.like]: `%${search.trim()}%`
          }
        },
        {
          content: {
            [Op.like]: `%${search.trim()}%`
          }
        }
      ];
    }

    const { count, rows: notes } = await Note.findAndCountAll({
      where: whereConditions,
      order: [
        ['isPinned', 'DESC'],
        ['updatedAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uuid;

    const note = await Note.findOne({
        where: {id, userId}
    })

    if (!note) {
      // console.log("no not //////////")
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    res.json({
      success: true,
      data: note
    });

  } catch (error) {
    console.error("Get note by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, meta = {}} = req.body;
    const userId = req.user.uuid;

    const note = await Note.findOne({
      where: {
        id,
        userId
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }
    // console.log(note, "note found ////////////////")
    if (title !== undefined && (!title || title.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty"
      });
    }

    const updatedContent = content !== undefined ? content : note.content;
    const characterCount = getCharacterCount(updatedContent);
    const wordCount = getWordCount(updatedContent);

    const existingMeta = getPlainMeta(note.meta);
    // console.log(existingMeta, "pplqin text //////////////")
    const updatedMeta = {
      ...existingMeta,
      characterCount,
      wordCount,
      lastModified: new Date().toISOString(),
      ...meta
    };

    await note.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(content !== undefined && { content }),
      meta: updatedMeta
    });

    res.json({
      success: true,
      message: "Note updated successfully",
      data: note
    });

  } catch (error) {
    console.error("Update note error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uuid;

    const note = await Note.findOne({
      where: {
        id,
        userId
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    await note.destroy();

    res.json({
      success: true,
      message: "Note deleted successfully"
    });

  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const toggleArchiveNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uuid;

    const note = await Note.findOne({
      where: {
        id,
        userId
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    const existingMeta = getPlainMeta(note.meta);
    // console.log(existingMeta, "////////////")
    await note.update({
      isArchived: !note.isArchived,
      meta: {
        ...existingMeta,
        lastModified: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: note
    });

  } catch (error) {
    console.error("Toggle archive note error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const togglePinNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uuid;

    const note = await Note.findOne({
      where: {
        id,
        userId
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    const existingMeta = getPlainMeta(note.meta);

    await note.update({
      isPinned: !note.isPinned,
      meta: {
        ...existingMeta,
        lastModified: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: note
    });

  } catch (error) {
    console.error("Toggle pin note error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getNoteStats = async (req, res) => {
  try {
    const userId = req.user.uuid;

    const stats = await Note.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalNotes'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN isArchived = true THEN 1 END')), 'archivedNotes'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN isPinned = true THEN 1 END')), 'pinnedNotes'],
        [sequelize.fn('SUM', sequelize.literal('JSON_EXTRACT(meta, "$.characterCount")')), 'totalCharacters'],
        [sequelize.fn('SUM', sequelize.literal('JSON_EXTRACT(meta, "$.wordCount")')), 'totalWords']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: stats[0] || {
        totalNotes: 0,
        archivedNotes: 0,
        pinnedNotes: 0,
        totalCharacters: 0,
        totalWords: 0
      }
    });

  } catch (error) {
    console.error("Get note stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleArchiveNote,
  togglePinNote,
  getNoteStats
};