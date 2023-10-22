// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBppI8FqUnvYRbcb3ODxekdOkzOrOdKOtg",
  authDomain: "tderequisicao-8b3c1.firebaseapp.com",
  projectId: "tderequisicao-8b3c1",
  storageBucket: "tderequisicao-8b3c1.appspot.com",
  messagingSenderId: "716098425450",
  appId: "1:716098425450:web:b7749f812f3b0587e2b013",
  measurementId: "G-BNLQXEVLVC"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();

// Adicione aqui as funções para autenticação, adicionar requisições, listar requisições, etc.
const auth = firebase.auth(app);

// Função para Registro
function register () {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const name = document.getElementById('register-name').value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Usuário criado. Adicionalmente, você pode salvar o nome ou outros campos no Firestore, se necessário.
      console.log('Usuário registrado com sucesso!');
      const user = userCredential.user;

      firebase.firestore().doc(`usuarios/${user.uid}`).set({
        email: user.email,
        role: 'user'
      });

      // Atualiza o nome de exibição
      user.updateProfile({
        displayName: name
      }).then(() => {
        console.log('Nome de exibição atualizado com sucesso!');
      }).catch((error) => {
        console.error('Erro ao atualizar o nome de exibição:', error.message);
      });

    })
    .catch((error) => {
      console.error('Erro ao registrar o usuário:', error.message);
    });
}

// Função para Login
let userRole = null; // Variável global para armazenar o papel do usuário

function login () {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Após autenticação bem-sucedida, recupere os dados do usuário do Firestore
      listRequests();
      return firebase.firestore().doc(`usuarios/${user.uid}`).get();
    })
    .then(doc => {
      if (doc.exists) {
        userRole = doc.data().role;
        console.log('Usuário autenticado com sucesso!');
        listRequests();
      } else {
        console.error('Dados do usuário não encontrados!');
      }
    })
    .catch((error) => {
      console.error('Erro ao autenticar:', error.message);
    });
}

// Função para Logout
function logout () {
  firebase.auth().signOut().then(() => {
    console.log('Usuário deslogado com sucesso!');
    location.reload()
    // Aqui, você pode fazer a lógica pós-logout, como limpar a UI.
  }).catch((error) => {
    console.error('Erro ao deslogar:', error.message);
  });
}


const db = firebase.firestore();

// Função para Adicionar Requisição
function addRequest () {
  const description = document.getElementById('request-description').value;
  const user = auth.currentUser;

  if (user) {
    // Acessando a subcoleção corretamente
    const requestsRef = firebase.firestore()
      .collection('usuarios')
      .doc(user.uid)
      .collection('requisicoes');

    // Adicionando documento à subcoleção
    requestsRef.add({
      descricao: description,
      hora: firebase.firestore.Timestamp.fromDate(new Date()),
      status: "Pendente",
      userId: user.uid,  // Novo campo: ID do usuário
      userEmail: user.email  // Novo campo: E-mail do usuário
    }).then(() => {
      console.log('Requisição adicionada com sucesso!');
      // Limpar campo de descrição
      document.getElementById('request-description').value = '';
      // Atualizar lista de requisições
      listRequests();
    }).catch((error) => {
      console.error('Erro ao adicionar requisição:', error.message);
    });
  }
}


// Função para Atualizar Status da Requisição
function updateRequestStatus (docId, newStatus, userId) {
  const user = auth.currentUser;
  if (user) {
    const requestRef = firebase.firestore()
      .collection('usuarios')
      .doc(userId)  // use o userId fornecido, não o do usuário atualmente autenticado
      .collection('requisicoes')
      .doc(docId);

    // Atualizando o documento
    requestRef.update({
      status: newStatus
    }).then(() => {
      console.log('Status da requisição atualizado com sucesso!');
      listRequests(); // Atualizar lista de requisições após a alteração
    }).catch((error) => {
      console.error('Erro ao atualizar status da requisição:', error.message);
    });
  }
}


// Função para Excluir Requisição
function deleteRequest (docId, userId) {
  console.log("Tentando excluir o documento com ID:", docId);  // Adicione esta linha
  const user = auth.currentUser;
  if (user) {
    const requestRef = firebase.firestore()
      .collection('usuarios')
      .doc(userId)  // Aqui, use o userId passado para a função
      .collection('requisicoes')
      .doc(docId);

    requestRef.delete().then(() => {
      console.log('Requisição excluída com sucesso!');
      listRequests(); // Atualizar lista de requisições após a exclusão
    }).catch((error) => {
      console.error('Erro ao excluir requisição:', error.message);
    });
  }
}


// Função para listar requisições
function listRequests () {
  const user = auth.currentUser;
  if (user) {
    let requestsRef;
    if (userRole === 'admin') {
      requestsRef = firebase.firestore().collectionGroup('requisicoes'); // Carrega requisições de todos os usuários
    } else {
      requestsRef = firebase.firestore().collection('usuarios').doc(user.uid).collection('requisicoes'); // Carrega apenas as requisições do usuário atual
    }

    requestsRef.get().then((querySnapshot) => {
      const requestsList = document.getElementById('requests-list');
      requestsList.innerHTML = ''; // Limpar lista existente
      querySnapshot.forEach((doc) => {
        const requestData = doc.data();
        const li = document.createElement('li');

        // Base displayText
        let displayText = requestData.descricao + " (" + requestData.status + ")";
        const textNode = document.createTextNode(displayText);
        li.appendChild(textNode);

        // Se o usuário for admin, exiba o e-mail do dono da requisição e os botões
        if (userRole === 'admin' && requestData.userEmail) {
          li.appendChild(document.createTextNode(` - Dono: ${requestData.userEmail}`));

          // Botão para editar o status
          const editStatusButton = document.createElement('button');
          editStatusButton.textContent = "Editar Status";
          editStatusButton.onclick = function () {
            const newStatus = prompt("Digite o novo status para a requisição:");
            if (newStatus) {
              updateRequestStatus(doc.id, newStatus, requestData.userId);
            }
          };
          li.appendChild(editStatusButton);

          // Botão para excluir
          const deleteButton = document.createElement('button');
          deleteButton.textContent = "Excluir";
          deleteButton.onclick = function (event) {
            event.stopPropagation();  // Adicione esta linha
            if (confirm("Tem certeza de que deseja excluir esta requisição?")) {
              deleteRequest(doc.id);
            }
          };
          li.appendChild(deleteButton);
        }

        li.onclick = function () {
          // Configurar a visualização de itens
          currentRequestId = doc.id;
          document.getElementById('current-request-description').textContent = requestData.descricao;
          document.getElementById('items-section').style.display = 'block'; // Mostrar a seção de itens
          listItems(); // Carregar itens da requisição
        };

        requestsList.appendChild(li); // Adicione a 'li' à lista de requisições
      });
    }).catch((error) => {
      console.error('Erro ao listar requisições:', error.message);
    });
  }
}


// Função para Adicionar Item
function addItem () {
  const user = firebase.auth().currentUser;
  const itemName = document.getElementById('item-name').value;
  const itemQuantity = parseInt(document.getElementById('item-quantity').value);
  const itemPrice = parseFloat(document.getElementById('item-price').value);

  if (user && currentRequestId) {
    const itemsRef = firebase.firestore()
      .collection('usuarios')
      .doc(user.uid)
      .collection('requisicoes')
      .doc(currentRequestId)
      .collection('itens');

    itemsRef.add({
      nome: itemName,
      quantidade: itemQuantity,
      preco: itemPrice
    }).then(() => {
      console.log('Item adicionado com sucesso!');
      // Limpar campos de entrada
      document.getElementById('item-name').value = '';
      document.getElementById('item-quantity').value = '';
      document.getElementById('item-price').value = '';
      // Atualizar lista de itens
      listItems();
    }).catch((error) => {
      console.error('Erro ao adicionar item:', error.message);
    });
  }
}

// Função para Atualizar Item
function updateItem (itemId) {
  const user = firebase.auth().currentUser;
  const newName = prompt("Novo nome do item:");
  const newQuantity = parseInt(prompt("Nova quantidade:"));
  const newPrice = parseFloat(prompt("Novo preço:"));

  if (user && currentRequestId && newName && !isNaN(newQuantity) && !isNaN(newPrice)) {
    const itemRef = firebase.firestore()
      .collection('usuarios')
      .doc(user.uid)
      .collection('requisicoes')
      .doc(currentRequestId)
      .collection('itens')
      .doc(itemId);

    itemRef.update({
      nome: newName,
      quantidade: newQuantity,
      preco: newPrice
    }).then(() => {
      console.log('Item atualizado com sucesso!');
      listItems();  // Atualizar lista de itens após a alteração
    }).catch((error) => {
      console.error('Erro ao atualizar item:', error.message);
    });
  }
}

// Função para Excluir Item
function deleteItem (itemId) {
  const user = firebase.auth().currentUser;
  if (user && currentRequestId) {
    const itemRef = firebase.firestore()
      .collection('usuarios')
      .doc(user.uid)
      .collection('requisicoes')
      .doc(currentRequestId)
      .collection('itens')
      .doc(itemId);

    itemRef.delete().then(() => {
      console.log('Item excluído com sucesso!');
      listItems();  // Atualizar lista de itens após a exclusão
    }).catch((error) => {
      console.error('Erro ao excluir item:', error.message);
    });
  }
}

function listItems () {
  const user = firebase.auth().currentUser;
  if (user && currentRequestId) {
    const itemsRef = firebase.firestore()
      .collection('usuarios')
      .doc(user.uid)
      .collection('requisicoes')
      .doc(currentRequestId)
      .collection('itens');

    itemsRef.get().then((querySnapshot) => {
      const itemsList = document.getElementById('items-list');
      itemsList.innerHTML = ''; // Limpar lista existente
      querySnapshot.forEach((doc) => {
        const itemData = doc.data();

        const li = document.createElement('li');
        li.textContent = `${itemData.nome} - ${itemData.quantidade} unidades - R$ ${itemData.preco.toFixed(2)}`;

        // Botão de Atualizar
        const updateButton = document.createElement('button');
        updateButton.textContent = "Atualizar";
        updateButton.onclick = function () {
          updateItem(doc.id);
        };
        li.appendChild(updateButton);

        // Botão de Excluir
        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Excluir";
        deleteButton.onclick = function () {
          deleteItem(doc.id);
        };
        li.appendChild(deleteButton);

        itemsList.appendChild(li);
      });
    }).catch((error) => {
      console.error('Erro ao listar itens:', error.message);
    });
  }
}

