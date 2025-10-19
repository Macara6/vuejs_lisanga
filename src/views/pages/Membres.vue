
<script setup>
import { userCreate, fetchSubstitute, fetchUser, updateUser, deleteUser} from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const toast = useToast();
const substitutes = ref([]);
const balanceFrozen = ref(true);
const router = useRouter();
const users = ref([])

const userDialog = ref(false);
const submitted = ref(false);
// champs du formaulaire
const username = ref('');
const first_name = ref('');
const last_name = ref('');
const email = ref('');
const phone_number=ref('');
const adress = ref('');
const substitute = ref('');
const matricule = ref('');
const password = ref('');
const confirmPassword = ref('');

const seletedUserId = ref(null);
const selectedSubstitute = ref(null)
const searchQuery = ref("");
const editMode = ref(false);
const created_by = localStorage.getItem('id')

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const showDeleteUser = ref(false);
const userToDelete = ref(null);


const loading = ref(false);
const usersCache = ref(null); // stocke la dernier requiperation
const lastFetchTime = ref(null); // temps du recuperation

function openNew(){
    userDialog.value = true;
    submitted.value =false;
}


onMounted(async() => {
   await fetchedSubstitute();
   await fetchedUsers();
});

function confirmDeleteUser(user) {
  userToDelete.value = user;
  showDeleteUser.value = true;
}

async function deleteSelectedUser(){
    if(!userToDelete.value) return;
    
    try{
      await deleteUser(userToDelete.value.id);
      toast.add({
      severity: 'success',
      summary: 'Supprimé',
      detail: `L'utilisateur ${userToDelete.value.username} a été supprimé avec succès.`,
      life: 3000,
    });
     
    showDeleteUser.value= false;
    userToDelete.value = null;
    await fetchedUsers(true);

   
    }catch(error){
      console.error('Erreur lors de la suppression de l’utilisateur :', error);
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Échec de la suppression de l'utilisateur.",
        life: 3000,
      });

    }
}



async function fetchedSubstitute(){
    try{
        substitutes.value = await fetchSubstitute();   
    }catch(error){
        console.error('error for fetching substitute', error);
    }
}
async function fetchedUsers(forceReload = false){
  if(usersCache.value && !forceReload){
    users.value =usersCache.value;
    return
  }
  loading.value = true;

    try{
        const response = await fetchUser();
        const currentUser = localStorage.getItem('id');
         const filtered = response.filter(user => user.id != currentUser);

        users.value = filtered;

        usersCache.value = users.value;
        
    }catch(error){
       console.error('error for fetching user', error); 
    }finally{
      loading.value = false;
    }
}


const filteredUsers = computed(() => {
    if(!searchQuery.value) return users.value;
    return users.value.filter(use => 
        use.username.toLowerCase().includes(searchQuery.value.toLowerCase())||
        use.first_name.toLowerCase().includes(searchQuery.value.toLowerCase())||
        use.last_name.toLowerCase().includes(searchQuery.value.toLowerCase())||
        use.matricule.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const substituteLabel =(sub) =>{
    return `${sub.first_name}-${sub.last_name}`;
}
// fonction pour modifier l'utilisateur
function editeUser(use){
    userDialog.value = true;
    editMode.value = true;
    seletedUserId.value=use.id;
    username.value=use.username
    first_name.value = use.first_name;
    last_name.value = use.last_name;
    email.value = use.email;
    phone_number.value=use.phone_number;
    adress.value = use.adress;
    selectedSubstitute.value = use.selectedSubstitute;
    matricule.value =use.matricule;
    password.value = use.password;
}

async function saveUser(){
    submitted.value = true;

    if (!username.value || !first_name.value || !last_name.value ) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000,
    });

    return;
  }
  if(username.value.includes(' ')) {
      toast.add({
    severity: 'error',
    summary: 'Nom utilisateur invalide',
    detail: "Le nom d'utilisateur ne doit pas contenir d'espaces.",
    life: 3000,
   });
   return;
  }

  const matriculeExiste = users.value.some(
    (user) => user.matricule === matricule.value
  );

  const emailExiste = users.value.some(
    (user) => user.email === email.value
  );

  if(emailExiste && !editMode.value){
      toast.add({
      severity: 'error',
      summary: 'Email existant',
      detail: "l'Email est déjà attribué à un autre membre.",
      life: 3000,
    });
    return;
  }

  if(matriculeExiste && !editMode.value){
      toast.add({
      severity: 'error',
      summary: 'Matricule existant',
      detail: 'Ce matricule est déjà attribué à un autre membre.',
      life: 3000,
    });
    return;
  }

  if (!editMode.value){
      if(password.value !== confirmPassword.value){
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe doivent être identiques', life: 3000 });
        return;
     }
    }

    const data = {
        username:username.value,
        first_name:first_name.value,
        last_name:last_name.value,
        email:email.value,
        phone_number:phone_number.value,
        adress:adress.value,
        substitute:selectedSubstitute.value,
        matricule:matricule.value,
        created_by:created_by,
        ...(editMode.value ? {} : { password : password.value}),
    };

    try{
        if(editMode.value){
            await updateUser(seletedUserId.value, data);
            toast.add({ severity: 'success', summary: 'Modifié', detail: 'Membre mis à jour', life: 3000 });
        }else{
          await userCreate(data);
          toast.add({ severity: 'success', summary: 'Ajouté', detail: 'Membre ajouté', life: 3000 });
        }
        userDialog.value = false;
        editMode.value = false;
        await fetchedUsers(true);
        resetForm();
    } catch(error){
        console.log('Error creating user', error);
         toast.add({ severity: 'error', summary: 'Error', detail: "error de creation de l'utilisateur", life: 3000 }); 
       }
}

function resetForm(){
        username.value = '';
        first_name.value = '';
        last_name.value = '';
        email.value = '';
        adress.value = '';
        phone_number.value = '';
        matricule.value = '';
        password.value = '';
        confirmPassword.value = '';
        selectedSubstitute.value = null;
        userDialog.value = false;
        submitted.value = false;

}

function viewUser(userId){
    console.log('Navigating to user detail with ID:', userId);
    router.push({name: 'userDetail', params: {id: userId}});

}
function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function foromatDate(dateString){
  if(!dateString) return "";
  const date = new Date(dateString);
  const day= String(date.getDate()).padStart(2,"0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;

}
function togglePassword(field){
  if(field ==='password'){
    showPassword.value = !showPassword.value;
  }else if (field ==='confirm'){
    showConfirmPassword.value = !showConfirmPassword.value;
  }
}

function downloadPDF(value){
  const doc = new jsPDF({unit: 'pt', format:'a4'});
  doc.setFontSize(14);
   doc.text(' Liste des Membres', 40, 40);


     const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Nom & Post-nom', dataKey: 'first_name' },
    { header: 'Prénom', dataKey: 'last_name' },
    { header: 'Matricule', dataKey: 'matricule' },
    { header: 'Téléphone', dataKey: 'phone_number' },
    { header: 'Épagne', dataKey: 'balance' },
  ];

  const rows = users.value.map(us => ({
    id:us.id,
    first_name:us.first_name,
    last_name:us.last_name,
    matricule:us.matricule,
    phone_number:us.phone_number,
    balance:us.balance
  }));

  autoTable(doc, {
      head:[columns.map(c => c.header)],
      body:rows.map(r => columns.map(c => r[c.dataKey])),
      startY: 70,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
  });
  doc.save('Liste_de_membres.pdf');


}




</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 bg-surface-50 dark:bg-surface-950 min-h-screen">
    <div class="card w-full max-w-7xl mx-auto shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
      <!-- Header principal -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b pb-3">
        <h2 class="font-semibold text-2xl text-center sm:text-left text-gray-800 dark:text-gray-100">
          Liste des membres
        </h2>

        <div class="flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-2 sm:gap-3">
          <Button label="Nouveau membre" icon="pi pi-plus" @click="openNew" class="w-full sm:w-auto" />
          <Button label="Télécharger PDF" icon="pi pi-file-pdf" severity="danger" class="w-full sm:w-auto" @click="downloadPDF" />
        </div>
      </div>

      <!-- Filtres / Recherche -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
        <ToggleButton
          v-model="balanceFrozen"
          onIcon="pi pi-lock"
          offIcon="pi pi-lock-open"
          onLabel="Balance"
          offLabel="Épargne"
          class="w-full sm:w-auto"
        />

        <div class="flex justify-center sm:justify-end w-full sm:w-auto">
          <span class="p-input-icon-left w-full sm:w-64">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher un membre..." class="w-full" />
          </span>
        </div>
      </div>

      <!-- Loader -->
      <div v-if="loading" class="flex justify-center items-center h-48">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <!-- Tableau des membres -->
      <div v-else class="overflow-x-auto">
        <DataTable
          :value="filteredUsers"
          scrollable
          scrollHeight="400px"
          class="w-full text-sm sm:text-base"
          tableStyle="min-width: 900px"
          stripedRows
        >
          <Column field="id" header="ID" style="min-width: 70px" />
          <Column field="username" header="Utilisateur" style="min-width: 150px" />
          <Column field="first_name" header="Nom & Post-nom" style="min-width: 180px" />
          <Column field="last_name" header="Prénom" style="min-width: 160px" />
          <Column field="matricule" header="Matricule" style="min-width: 150px" />
          <Column field="phone_number" header="Téléphone" style="min-width: 150px" />
          <Column field="email" header="E-mail" style="min-width: 200px" />
          <Column
            field="balance"
            header="Épargne"
            style="min-width: 160px"
            alignFrozen="right"
            :frozen="balanceFrozen"
          >
            <template #body="{ data }">
              <span class="font-semibold text-green-600">${{ formatCurrency(data.balance) }}</span>
            </template>
          </Column>
          <Column field="date_joined" header="Date" style="min-width: 160px">
            <template #body="{ data }">{{ foromatDate(data.date_joined) }}</template>
          </Column>
          <Column header="Actions" style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex justify-center gap-2 flex-wrap">
                <Button icon="pi pi-eye" class="p-button-sm" tooltip="Voir" @click="viewUser(data.id)" />
                <Button icon="pi pi-pencil" class="p-button-sm p-button-success" tooltip="Modifier" @click="editeUser(data)" />
                <Button icon="pi pi-trash" class="p-button-sm p-button-danger" tooltip="Supprimer" @click="confirmDeleteUser(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog Ajout / Édition -->
    <Dialog
      v-model:visible="userDialog"
      :style="{ width: '90vw', maxWidth: '600px' }"
      :header="editMode ? 'Modifier un membre' : 'Nouveau membre'"
      modal
      class="rounded-2xl"
    >
      <div class="flex flex-col gap-6">
        <!-- Username -->
        <div>
          <label class="block font-bold mb-2">Nom d'utilisateur</label>
          <InputText id="username" v-model="username" required placeholder="ex: jdupont" fluid />
          <small v-if="submitted && !username" class="text-red-500">Nom requis.</small>
        </div>

        <!-- Nom et prénom -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold mb-2">Nom & Post-nom</label>
            <InputText v-model="first_name" required fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Prénom</label>
            <InputText v-model="last_name" required fluid />
          </div>
        </div>

        <!-- Téléphone / Matricule -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold mb-2">Téléphone</label>
            <InputText v-model="phone_number" placeholder="ex: +243..." fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Matricule</label>
            <InputText v-model="matricule" fluid />
          </div>
        </div>

        <!-- Adresse / Email / Suppléant -->
        <div>
          <label class="block font-bold mb-2">Adresse</label>
          <InputText v-model="adress" placeholder="ex: Kinshasa/Limete" fluid />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold mb-2">E-mail</label>
            <InputText v-model="email" placeholder="ex: email@gmail.com" fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Suppléant</label>
            <Select
              v-model="selectedSubstitute"
              :options="substitutes"
              :optionLabel="substituteLabel"
              optionValue="id"
              placeholder="Sélectionner"
              fluid
            />
          </div>
        </div>

        <!-- Mot de passe -->
        <div v-if="!editMode" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="relative">
            <label class="block font-bold mb-2">Mot de passe</label>
            <InputText :type="showPassword ? 'text' : 'password'" v-model="password" required fluid />
            <i
              :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              class="absolute right-3 top-12 cursor-pointer text-gray-500"
              @click="togglePassword('password')"
            />
          </div>
          <div class="relative">
            <label class="block font-bold mb-2">Confirmer mot de passe</label>
            <InputText :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" required fluid />
            <i
              :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              class="absolute right-3 top-12 cursor-pointer text-gray-500"
              @click="togglePassword('confirm')"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 flex-wrap">
          <Button label="Annuler" icon="pi pi-times" text @click="userDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" class="p-button-success" @click="saveUser" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog Suppression -->
    <Dialog
      v-model:visible="showDeleteUser"
      :style="{ width: '90vw', maxWidth: '450px' }"
      header="Confirmation"
      modal
      class="rounded-2xl"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl text-yellow-500" />
        <span>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</span>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Non" icon="pi pi-times" text @click="showDeleteUser = false" />
          <Button label="Oui" icon="pi pi-check" class="p-button-danger" text @click="deleteSelectedUser" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
