# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install the app dependencies using yarn
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port on which the Node.js app will run
EXPOSE 5000

# Specify the command to run the app
CMD ["yarn", "start"]