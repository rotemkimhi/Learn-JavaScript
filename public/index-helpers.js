// index-helpers.js

  // all the functions from the index.html page
  function displayActiveUsers(users, socket) {
    const activeUsersList = document.getElementById('active-users-list');
    activeUsersList.innerHTML = '';

    // Add a heading with a class for styling
    const heading = document.createElement('p');
    heading.textContent = 'Active users:';
    activeUsersList.appendChild(heading);

    for (const user of users) {
      if (user.active) {
        const listItem = document.createElement('li');
        listItem.textContent = `${user.name} - ${user.type}`;
        activeUsersList.appendChild(listItem);

        // Check if the user is the current user based on their socket ID
        if (user.socketId === socket.id) {
          const helloMessage = document.getElementById('hello-message');
          helloMessage.textContent = `Hello ${user.name}!`;
        }
      }
    }
  }

  function displayCodeBlocks(codeBlocks) {
    const codeBlockList = document.getElementById('code-block-list');
    codeBlockList.innerHTML = '';

    for (const codeBlock of codeBlocks) {
      const listItem = document.createElement('li');
      listItem.classList.add('code-block-list-item');
      listItem.textContent = codeBlock.title;

      listItem.addEventListener('click', () => {
        const roomId = generateRoomId(codeBlock.id);

        // Include the room ID in the URL when redirecting
        window.location.href = `/code-block/${codeBlock.id}?roomId=${roomId}`;
      });

      codeBlockList.appendChild(listItem);
    }
  }

function generateRoomId(id) {
  return `room-${id}`;
}


  export { displayActiveUsers, displayCodeBlocks, generateRoomId };