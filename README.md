# How to set up NextJS Project
(Assumes you are using Windows)
## Pre-requisites
### 1. Install NodeJS
   - Check if you have Node and npm installed
     - In Powershell run the following commands
       - ``` node -v ```
       - ``` npm -v ```
     - If you get back a version number then you have Node and npm installed
   - If Node or npm is not installed:
     - Go to NodeJS [downloads page](https://nodejs.org/en/download)
     - Download the Windows x64 Installer
     - Install Node and npm
### 2. Install pnpm 
   - Check if you have pnpm installed
     - In Powershell run the following commands
       - ``` pnpm -v ```
       - If you get back a version number then you have pnpm installed
   - If pnpm is not installed:
     - Windows: ``` npm install -g pnpm@latest-11```
     - Installation Doc [link](https://pnpm.io/installation)
### 3. Restart ALL terminal and VSCode instances
## Setup
### 1. Open terminal where you want to clone the repo
### 2. Clone repo
  ```
  git clone https://github.com/Tims-Sims/mahcma.git
  ```
### 3. Move into the Cloned Repository
  ```
  cd mahcma
  ``` 
### 4. Install using pnpm
  - Move into the cloned repository
  - In the cloned project folder, open in terminal and run
    - ```pnpm install```
### 5. Run the Dev Server
  ```
  pnpm dev
  ```
### 6. Access the Dev Server
  - Once started it should give you a link to localhost
  - It should be http://localhost:3000
