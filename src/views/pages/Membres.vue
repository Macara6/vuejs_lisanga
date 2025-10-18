
<script setup>
import { userCreate, fetchSubstitute, fetchUser, updateUser} from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';


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

function openNew(){
    userDialog.value = true;
    submitted.value =false;
}


onMounted(async() => {
   await fetchedSubstitute();
   await fetchedUsers();
});

async function fetchedSubstitute(){
    try{
        substitutes.value = await fetchSubstitute();   
    }catch(error){
        console.error('error for fetching substitute', error);
    }
}
async function fetchedUsers(){
    try{
        const response = await fetchUser();
        const currentUser = localStorage.getItem('id');
        users.value = response.filter(user => user.id !=currentUser);
    }catch(error){
       console.error('error for fetching user', error); 
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
        await fetchedUsers();
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


</script>

<template>
    <div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Liste des membres</div>
         <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
        
        <Button 
            label="Nouveau membre" 
            icon="pi pi-plus" 
            
            @click="openNew" 
        />

        <!-- Zone droite : balance + recherche -->
            <div class="flex items-center gap-3">
                <!-- Toggle Balance -->
                <ToggleButton 
                    v-model="balanceFrozen" 
                    onIcon="pi pi-lock" 
                    offIcon="pi pi-lock-open" 
                    onLabel="Balance" 
                    offLabel="Balance" 
                />

                <!-- Barre de recherche -->
                <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText 
                        v-model="searchQuery" 
                        placeholder="Rechercher..." 
                        class="w-64" 
                    />
                </span>
            </div>
        </div>
       
        <DataTable :value="filteredUsers" scrollable scrollHeight="400px" class="mt-6">
            <Column field="id" header="Id" style="min-width: 100px"></Column>
            <Column field="username" header="Nom utilisateur" style="min-width: 200px"></Column>
            <Column field="first_name" header="Nom & Post-nom" style="min-width: 200px"></Column>
            <Column field="last_name" header="Prénom" style="min-width: 200px"></Column>
            <Column field="substitute_name" header="Suppléant" style="min-width: 200px"></Column>
            <Column field="matricule" header="Matricule" style="min-width: 200px"></Column>
            <Column field="phone_number" header="Phone" style="min-width: 200px"></Column>
            <Column field="email" header="E-mail" style="min-width: 200px"></Column>
            <Column field="balance" header="Épargne" style="min-width: 200px" alignFrozen="right" :frozen="balanceFrozen">
                <template #body="{ data }">
                    <span class="font-bold">${{ formatCurrency(data.balance) }}</span>
                </template>
            </Column>
            <Column field="date_joined" header="Date" style="min-width: 200px">
              <template #body="{data}">
                {{ foromatDate(data.date_joined) }}
              </template>
            </Column>
            <Column header="Actions" style="min-width: 150px">
            <template #body="{ data }">
                <Button  class="mr-1" icon="pi pi-pencil"  tooltip="Modifier" @click="editeUser(data)" />
                <Button  class="mr-1" icon="pi pi-trash" severity="danger" @click="confirmDeleteSubstitute(data)" tooltip="Supprimer" />
                 <Button  icon="pi pi-eye"  tooltip="voir" @click="viewUser(data.id)" />
            </template>
            </Column>
        </DataTable>
    </div>

        <Dialog
        v-model:visible="userDialog"
        :style="{ width: '600px' }"
        :header="editMode ? 'Modifier': 'Ajout membre'"
        :modal="true"
            >   
        <div class="flex flex-col gap-6">
            <!-- Nom d'utilisateur -->
            <div>
            <label for="username" class="block font-bold mb-3">Nom d'utilisateur</label>
            <InputText id="username" v-model="username" required autofocus fluid />
            <small v-if="submitted && !username" class="text-red-500">Nom requis.</small>
            </div>

    <!-- Nom + Post-nom -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-6">
        <label for="first_name" class="block font-bold mb-3">Nom & Post-nom</label>
        <InputText id="first_name" v-model="first_name" required fluid />
        <small v-if="submitted && !first_name" class="text-red-500">Nom requis.</small>
      </div>
      <div class="col-span-6">
        <label for="last_name" class="block font-bold mb-3">Prénom</label>
        <InputText id="last_name" v-model="last_name" required fluid />
        <small v-if="submitted && !last_name" class="text-red-500">Post-nom requis.</small>
      </div>
    </div>

    <!-- Téléphone + Matricule -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-6">
        <label for="phone" class="block font-bold mb-3">Téléphone</label>
        <InputText id="phone" v-model="phone_number" fluid />
      </div>
      <div class="col-span-6">
        <label for="matricule" class="block font-bold mb-3">Matricule</label>
        <InputText id="matricule" v-model="matricule" fluid />
      </div>
    </div>

    <!-- Suppléant -->
    <div>
    <label for="adress" class="block font-bold mb-3">Adresse</label>
    <InputText id="adress" v-model="adress" placeholder="ex: Kinshasa/Limete" fluid />
    </div>

    <!-- Email + Adresse -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-6">
        <label for="email" class="block font-bold mb-3">E-mail</label>
        <InputText id="email" v-model="email" placeholder="ex: text@gmail.com" fluid />
      </div>
      <div class="col-span-6">
      <label for="suppléant" class="block font-bold mb-3">Suppléant</label>

      <Select
        id="suppléant"
        v-model="selectedSubstitute"
        :options="substitutes"
        :optionLabel="substituteLabel"
        optionValue="id"
        placeholder="Sélectionner un suppléant"
        fluid
      />
      </div>
    </div>

    <!-- Mot de passe + Confirmation -->
<div v-if="!editMode" class="grid grid-cols-12 gap-4">
  <div class="col-span-6 relative">
    <label for="password" class="block font-bold mb-3">Mot de passe</label>
    <InputText
      id="password"
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      required
      fluid
    />
    <!-- Icône toggle -->
    <i
      :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
      class="absolute right-3 top-12 cursor-pointer text-gray-500"
      @click="togglePassword('password')"
    />
  </div>

  <div class="col-span-6 relative">
    <label for="confirmPassword" class="block font-bold mb-3">Confirmer mot de passe</label>
    <InputText
      id="confirmPassword"
      v-model="confirmPassword"
      :type="showConfirmPassword ? 'text' : 'password'"
      required
      fluid
    />
    <!-- Icône toggle -->
    <i
      :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
      class="absolute right-3 top-12 cursor-pointer text-gray-500"
      @click="togglePassword('confirm')"
    />
    <small v-if="submitted && password !== confirmPassword" class="text-red-500">
      Les mots de passe doivent être identiques.
    </small>
  </div>
</div>


  </div>

  <!-- Footer -->
  <template #footer>
    <Button label="Annuler" icon="pi pi-times" text @click="userDialog = false" />
    <Button label="Enregistrer" icon="pi pi-check" @click="saveUser" />
  </template>
</Dialog>
    </div>
</template>