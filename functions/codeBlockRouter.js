// codeBlockRouter.js

const express = require('express');
const path = require('path');
const codeBlocks = require(`./codeBlocks`);
const router = express.Router();
const rootDirectory = path.resolve(`${__dirname}/..`);



router.get("/:id", (req, res) => {
    const blockId = parseInt(req.params.id);
    const selectedBlock = codeBlocks.find(block => block.id === blockId);
  
    if (!selectedBlock) {
      res.status(404).send('Code block not found');
      return;
    }
  
    res.sendFile(path.join(rootDirectory, `blocks/${selectedBlock.name}.html`));
  });
  
  module.exports = router;