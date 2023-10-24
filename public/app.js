function showRegister () {
  hideElement('login-section');
  showElement('register-section');
}

function showLogin () {
  showElement('login-section');
  hideElement('register-section');
  hideElement('requests-section');
}

function showRequests () {
  hideElement('login-section');
  hideElement('register-section');
  showElement('requests-section');
}

function hideElement (elementId) {
  document.getElementById(elementId).style.display = 'none';
}

function showElement (elementId) {
  document.getElementById(elementId).style.display = '';
}

const firebaseConfig = {
  apiKey: "AIzaSyBppI8FqUnvYRbcb3ODxekdOkzOrOdKOtg",
  authDomain: "tderequisicao-8b3c1.firebaseapp.com",
  projectId: "tderequisicao-8b3c1",
  storageBucket: "tderequisicao-8b3c1.appspot.com",
  messagingSenderId: "716098425450",
  appId: "1:716098425450:web:b7749f812f3b0587e2b013",
  measurementId: "G-BNLQXEVLVC"
};

function isOnline () {
  return navigator.onLine;
}

async function getCityFromCoords (latitude, longitude) {
  const accessToken = 'pk.eyJ1IjoicGRyb3NvdXphIiwiYSI6ImNsbzNjenFwODBmYmUyc21vZ3h5eno3N3MifQ.1V6wvqbsW6WUpuKbKWgXRg';  // Substitua pelo seu token
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json()

  if (data && data.features && data.features.length > 0) {
    const placeData = data.features[0];

    for (let feature of data.features) {
      if (feature.place_type.includes("place")) {
        return feature.text;
      }
    }
  }
  return null;
}
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();

// Adicione aqui as funções para autenticação, adicionar requisições, listar requisições, etc.
const auth = firebase.auth(app);

// Função para Registro
// Função para Registro
function register () {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const name = document.getElementById('register-name').value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const city = await getCityFromCoords(latitude, longitude);

          try {
            await firebase.firestore().doc(`usuarios/${user.uid}`).set({
              email: user.email,
              role: 'user',
              location: { latitude, longitude },
              city: city
            });
            showLogin();
            console.log('Usuário registrado com sucesso!');
          } catch (error) {
            console.error('Erro ao registrar o usuário e a localização:', error.message);
          }
        }, error => {
          console.warn('Erro ao obter geolocalização:', error.message);
        });
      } else {
        console.warn('Geolocalização não é suportada neste navegador.');
      }
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
      return firebase.firestore().doc(`usuarios/${user.uid}`).get()
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
  showRequests();
  initFCM();
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
  showLogin();
}

const db = firebase.firestore();

function addRequest () {
  const description = document.getElementById('request-description').value;
  const user = auth.currentUser;
  const requestData = {
    descricao: description,
    hora: firebase.firestore.Timestamp.fromDate(new Date()),
    status: "Pendente",
    userId: user.uid,
    userEmail: user.email
  };

  if (navigator.onLine) {
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
      $('#addRequestModal').modal('hide');
    }
  } else {
    addRequestOffline(requestData);
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
      requestsRef = firebase.firestore().collectionGroup('requisicoes');
    } else {
      requestsRef = firebase.firestore().collection('usuarios').doc(user.uid).collection('requisicoes');
    }

    requestsRef.get().then((querySnapshot) => {
      const requestsList = document.getElementById('requests-list');
      requestsList.innerHTML = '';

      const processRequest = (doc, requestData, city) => {
        const li = document.createElement('li');

        let displayText = requestData.descricao + " (" + requestData.status + ")";
        const textNode = document.createTextNode(displayText);
        li.appendChild(textNode);

        if (userRole === 'admin' && requestData.userEmail) {
          li.appendChild(document.createTextNode(` - Dono: ${requestData.userEmail}`));
          li.appendChild(document.createTextNode(` - Cidade: ${city}`));

          const editStatusButton = document.createElement('button');
          editStatusButton.textContent = "Editar Status";
          editStatusButton.onclick = function () {
            const newStatus = prompt("Digite o novo status para a requisição:");
            if (newStatus) {
              updateRequestStatus(doc.id, newStatus, requestData.userId);
            }
          };
          li.appendChild(editStatusButton);

          const deleteButton = document.createElement('button');
          deleteButton.textContent = "Excluir";
          deleteButton.onclick = function (event) {
            event.stopPropagation();
            if (confirm("Tem certeza de que deseja excluir esta requisição?")) {
              deleteRequest(doc.id);
            }
          };
          li.appendChild(deleteButton);
        }

        li.onclick = function () {
          $('#addItemModal').modal('show');
          currentRequestId = doc.id;
          document.getElementById('current-request-description').textContent = requestData.descricao;
          document.getElementById('modal-items-list').style.display = 'block';
          listItems();
        };

        requestsList.appendChild(li);
      };

      querySnapshot.forEach((doc) => {
        const requestData = doc.data();

        if (userRole === 'admin') {
          const userRef = firebase.firestore().collection('usuarios').doc(requestData.userId);

          userRef.get().then(userDoc => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              processRequest(doc, requestData, userData.city);
            }
          }).catch(error => {
            console.error('Erro ao obter dados do usuário:', error.message);
          });
        } else {
          processRequest(doc, requestData, null);
        }
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

    if (isOnline()) {
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
    } else {
      // Se estiver offline, armazene os dados localmente e registre uma tag de sincronização
      storeItemLocally(itemName, itemQuantity, itemPrice, currentRequestId, user.uid);
      navigator.serviceWorker.ready.then(function (registration) {
        return registration.sync.register('sync-items');
      });
    }
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

    const itemsList = document.getElementById('modal-items-list');
    itemsList.innerHTML = ''; // Limpar lista existente

    itemsRef.get().then((querySnapshot) => {
      const itemsList = document.getElementById('modal-items-list');
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

  $('#addItemModal').modal('show');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function (registration) {
    console.log('Service Worker messaging ativo com sucesso:', registration);
  }).catch(function (error) {
    console.log('Falha ao registrar o Service Worker:', error);
  });
} else {
  console.warn('Service Worker não é suportado neste navegador.');
}

const messaging = firebase.messaging();

function initFCM () {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('Permissão concedida.');

      messaging.getToken().then((token) => {
        console.log('Token FCM:', token);
        storeUserToken(token);  // Aqui você armazena o token no Firestore
      });
    } else {
      console.error('Permissão não concedida.');
    }
  }).catch((error) => {
    console.error('Erro ao obter permissão:', error);
  });
}

function storeUserToken (token) {
  const user = firebase.auth().currentUser;
  if (user) {
    const tokensRef = firebase.firestore().collection('usuarios').doc(user.uid).collection('tokens');
    tokensRef.add({ token: token })
      .then(() => {
        console.log('Token armazenado com sucesso!');
      })
      .catch((error) => {
        console.error('Erro ao armazenar o token:', error.message);
      });
  }
}

messaging.onMessage((payload) => {
  console.log('Notificação recebida:', payload);
  displayNotification(payload);
});

function displayNotification (payload) {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações do sistema.");
    return;
  }

  let title = payload.notification.title;
  let options = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    badge: payload.notification.badge
  };

  new Notification(title, options);
}

async function addRequestOffline (data) {
  const savedRequests = await localforage.getItem('savedRequests') || [];
  savedRequests.push(data);
  await localforage.setItem('savedRequests', savedRequests);
}

window.addEventListener('online', async () => {
  const user = auth.currentUser; // Garanta que temos o usuário atual
  const savedRequests = await localforage.getItem('savedRequests') || [];

  const requestsRef = firebase.firestore()
    .collection('usuarios')
    .doc(user.uid)
    .collection('requisicoes');

  for (let request of savedRequests) {
    requestsRef.add(request).then(() => {
      console.log('Requisição adicionada com sucesso!');
      // Atualizar lista de requisições
      listRequests();
    }).catch((error) => {
      console.error('Erro ao adicionar requisição:', error.message);
    });
  }

  await localforage.setItem('savedRequests', []);
});

document.addEventListener('DOMContentLoaded', (event) => {
  // Solicitar permissão para localização
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      console.log('Localização permitida:', position);
    }, error => {
      console.warn('Erro ao obter geolocalização:', error.message);
    });
  } else {
    console.warn('Geolocalização não é suportada neste navegador.');
  }

  // Solicitar permissão para notificações
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Permissão de notificação concedida.');
      } else {
        console.warn('Permissão de notificação não concedida.');
      }
    });
  } else {
    console.log("Este navegador não suporta notificações do sistema.");
  }
});
