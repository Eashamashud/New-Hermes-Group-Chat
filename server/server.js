const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Group = require('./models/Group');

// Import Models
const User = require('./models/User');
const Message = require('./models/Message');

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the "public" folder

// Connect to MongoDB
mongoose.connect('mongodb+srv://nicoleye301:XgHVNsrpmFTh2ZV6@cluster0.05bnf.mongodb.net/hermes-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Active Groups
const activeGroups = new Set();

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Add a friend
app.post('/add-friend', async (req, res) => {
  const { username, friendUsername } = req.body;

  try {
    const user = await User.findOne({ username });
    const friend = await User.findOne({ username: friendUsername });

    if (!user || !friend) {
      return res.status(404).json({ message: 'User or friend not found' });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding friend', error });
  }
});

// Get user's friends
app.get('/friends/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate('friends', 'username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error });
  }
});

// Fetch messages between friends
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

// Send a message to a friend
app.post('/message', async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    const user = await User.findOne({ username: sender }).populate('friends', 'username');
    const isFriend = user.friends.some((friend) => friend.username === receiver);

    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message your friends' });
    }

    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});


// Create a new group
app.post('/create-group', async (req, res) => {
  const { groupName, creatorUsername } = req.body;

  try {
    // Find the creator
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Check if the group name already exists
    const existingGroup = await Group.findOne({ name: groupName });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    // Create the group and add the creator as a member
    const newGroup = new Group({ name: groupName, members: [creator._id] });
    await newGroup.save();

    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error });
  }
});

// Add a member to a group
app.post('/add-member', async (req, res) => {
  const { groupName, memberUsername } = req.body;

  try {
    const group = await Group.findOne({ name: groupName });
    const member = await User.findOne({ username: memberUsername });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    if (group.members.includes(member._id)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    group.members.push(member._id);
    await group.save();

    res.status(200).json({ message: 'Member added successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error });
  }
});


// Socket.IO for Group Chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a group
  socket.on('joinGroup', (groupName) => {
    socket.join(groupName);
    console.log(`User ${socket.id} joined group: ${groupName}`);
  });

  // Send a message to a group
  socket.on('groupMessage', async ({ groupName, sender, content }) => {
    try {
      const group = await Group.findOne({ name: groupName });
      if (!group) {
        return console.error('Group not found');
      }

      const user = await User.findOne({ username: sender });
      if (!user || !group.members.includes(user._id)) {
        return console.error('User not authorized to send messages to this group');
      }

      const message = { sender: user._id, content };
      group.messages.push(message);
      await group.save();

      io.to(groupName).emit('receiveGroupMessage', { sender: user.username, content });
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});


// Start Server
const PORT = process.env.PORT || 5004;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
