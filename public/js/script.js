// Replace the API endpoints with your server URLs
const apiUrl = 'http://localhost:3000';
let userId= 1

// Fetch Books and Populate Book Listing Page
async function fetchBooks() {
  try {
    const response = await fetch(`${apiUrl}/books`);
    const books = await response.json();

    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';

    books.forEach((book) => {
      const bookItem = document.createElement('div');
      bookItem.classList.add('book-item');
      bookItem.innerHTML = `
        <div>
        <img src=${book.imgurl}></img>
        <div>
        <h3>${book.title}</h3>
        <p>By: ${book.author}</p>
        <p>Price: $${book.price}</p>
        <p>${book.description}</p>
        <button class="add-to-cart-btn" data-book-id="${book.id}">Add to Cart</button>
        </div>
        </div>
      `;

      booksList.appendChild(bookItem);
    });

    // Attach event listener to "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', addToCart);
    });
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while fetching books.');
  }
}

// Add to Cart Function
async function addToCart(event) {
  const bookId = event.target.dataset.bookId;

  try {
    const response = await fetch(`${apiUrl}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookId, userId }),
    });

    if (response.ok) {
      alert('Book added to cart successfully.');
    } else {
      alert('Failed to add the book to the cart.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while adding the book to the cart.');
  }
}

// Fetch Cart Data
async function fetchCartData() {
  try {
    const response = await fetch(`${apiUrl}/cart?userId=${userId}`); // Include the user ID in the URL
    if (response.ok) {
      const cartBooks = await response.json();
      console.log('Cart Books:', cartBooks); // Use the cartBooks data as needed
      const cartItemsTableBody = document.getElementById('cart-items');
      cartItemsTableBody.innerHTML = '';

      let totalValue = 0;

      cartBooks.forEach((book) => {
        const bookItemRow = document.createElement('tr');
        bookItemRow.innerHTML = `
          <td>${book.title}</td>
          <td>$${book.price.toFixed(2)}</td>
        `;
        cartItemsTableBody.appendChild(bookItemRow);

        totalValue += book.price;
      });
      const totalValueSpan = document.getElementById('total-value');
      totalValueSpan.textContent = totalValue.toFixed(2);
    } else {
      console.error('Error fetching cart data.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while fetching cart data.');
  }
}

function payNow() {
  // Get the total cart value
  const totalValue = parseFloat(document.getElementById('total-value').textContent);

  // Prompt the user for card details (this is just for testing)
  const cardNumber = prompt('Enter your card number:');
  const cardExpiration = prompt('Enter the card expiration date (MM/YYYY):');
  const cardCVV = prompt('Enter the card CVV:');

  // Display the payment details (for demonstration purposes)
  const paymentDetails = `
    <p>Payment Amount: $${totalValue.toFixed(2)}</p>
    <p>Card Number: ${cardNumber}</p>
    <p>Expiration: ${cardExpiration}</p>
    <p>CVV: ${cardCVV}</p>
  `;

  // Update the content of the payment details container
  const paymentDetailsContainer = document.getElementById('payment-details');
  paymentDetailsContainer.innerHTML = paymentDetails;
}


// Fetch Books on Book Listing Page Load
if (window.location.pathname === '/books.html') {
  fetchBooks();
}

// Fetch Cart Data when needed (e.g., on cart.html page load)
if (window.location.pathname === '/cart.html') {
  fetchCartData();
}

