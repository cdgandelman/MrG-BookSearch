const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    users: async () => {
      return User.find().populate('thoughts');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username }).populate('thoughts');
    },

    me: async (parent, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('thoughts');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },


  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    addBook: async (parent, {authors, description, bookId, image, link, title} , context) => {
        if (context.user) {
          
          return await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet:{
                authors: authors,
                description: description,
                bookId: bookId,
                image: image,
                link: link,
                title: title,
              } }
          );
        }
        throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (parent, {userId, bookId})=>{
        return await User.findOneAndUpdate(
            {_id: userId},
            { $pull:{savedBooks:{bookId:bookId}}},
            {new: true}
        )
    }
  }
};

module.exports = resolvers;
