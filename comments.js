// create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto'); // to generate random id
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// get all comments
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []); // send back empty array if no comments
});

// create new comment
app.post('/posts/:id/comments', (req, res) => {
  const commentId = randomBytes(4).toString('hex'); // generate random id
  const { content } = req.body; // get content from request body
  const comments = commentsByPostId[req.params.id] || []; // get all comments for the post
  comments.push({ id: commentId, content, status: 'pending' }); // add new comment to comments array
  commentsByPostId[req.params.id] = comments; // store comments array
  res.status(201).send(comments); // send back all comments
});

// receive event from event bus
app.post('/events', (req, res) => {
  console.log('Event Received:', req.body.type);
  const { type, data } = req.body;

  // if event is comment moderated
  if (type === 'CommentModerated') {
    // get comments for the post
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    // find the comment that was moderated
    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;

    // emit event to event bus
    axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        postId,
        status,
        content,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});