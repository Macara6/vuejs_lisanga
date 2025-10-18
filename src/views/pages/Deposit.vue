<script setup>
import { ref, onMounted } from "vue";
import { adminDeposit, fetchUser } from "@/service/Api";
import { useToast } from "primevue/usetoast";


const step = ref(1);
const matricule = ref("");
const amount = ref(null);
const loading = ref(false);
const toast = useToast();
const summary = ref({});
const errors = ref({}); 
const targetUser = ref(null)


function nextFromMatricule(){
   fetchUserOrMatricule();
}


function backToMatricule() {
  step.value = 1;
}

async function submitDeposit() {
 errors.value = {};

 if(!amount.value || Number(amount.value) <= 0){
    errors.value.amount =['Le montant doit être suppérieur à 0'];
    return;
 }

  loading.value = true;
  try {
    const response = await adminDeposit(matricule.value, amount.value,);
    summary.value = response;
    step.value = 3; // aller au résumé
    toast.add({ severity: "success", summary: "Succès", detail: "Dépôt effectué avec succès !" });
  } catch (error) {
    if(error.response && error.response.data){
        errors.value = error.response.data;

        const msgs = Object.values(error.response.data)
        .flat()
        .map(v => String(v))
        .join(" | ");
        toast.add({ severity: "error", summary: "Erreur API", detail: msgs || "Erreur" });
        console.log(msgs);
    }else{
        toast.add({ severity: "error", summary: "Erreur", detail: "Échec du dépôt." });
    }
   
  } finally {
    loading.value = false;
  }
}
function newDeposit(){
  matricule.value = "";
  amount.value = null;
  summary.value = {};
  errors.value = {};
  step.value = 1;
}

async function fetchUserOrMatricule(){
    errors.value={};
    targetUser.value=null;
    if(!matricule.value || !matricule.value.trim()){
        errors.value = ['le matricule est requis'];
        return false;
    }
    try{
        const users = await fetchUser();
        const user = users.find(u => u.matricule === matricule.value.trim());
        if(!user){
            errors.value.matricule= ['Utilisateur introuvable avec ce matricule'];
            return false;
        }
        targetUser.value = user;
        step.value =2;
        return true;
    }catch(error){
        errors.value.matricule = ['Erreur lors de la récupération du matricule']
        console.log(error);
        return false;
    }
 
}
</script>

<template>
<div class="flex justify-center items-start min-h-screen bg-gray-100 py-12">
  <div class="w-full md:w-3/4 lg:w-2/3">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">💰 Dépôt Épargne</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Visualisez le compte avant de déposer</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center justify-between mb-10">
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">1</div>
        <div class="flex-1 h-1 mx-4" :class="step>1 ? 'bg-blue-300' : 'bg-gray-300'"></div>
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">2</div>
        <div class="flex-1 h-1 mx-4" :class="step>2 ? 'bg-blue-300' : 'bg-gray-300'"></div>
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">3</div>
      </div>

      <!-- Step 1: Matricule -->
      <div v-if="step === 1" class="space-y-4">
        <label class="font-medium text-gray-700 dark:text-gray-200">Matricule de l'utilisateur</label>
        <InputText v-model="matricule" placeholder="Ex: USR-12345" class="w-full border-gray-300 rounded-lg" />
        <div v-if="errors.matricule" class="text-red-600 text-sm">
          <div v-for="(e, i) in errors.matricule" :key="i">{{ e }}</div>
        </div>
        <div class="flex justify-end mt-4">
          <Button label="Suivant" icon="pi pi-arrow-right" class="p-button-rounded p-button-primary" @click="nextFromMatricule" />
        </div>
      </div>

      <!-- Step 2: Détails du compte + montant -->
      <div v-else-if="step === 2" class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Détails du compte</h3>
          <p><b>Nom :</b> {{ targetUser.first_name }} {{ targetUser.last_name }}</p>
          <p><b>Username :</b> {{ targetUser.username }}</p>
          <p><b>Email :</b> {{ targetUser.email }}</p>
          <p><b>Solde actuel :</b> {{ targetUser.balance }} USD</p>
        </div>

        <label class="font-medium text-gray-700 dark:text-gray-200 mt-4">Montant du dépôt</label>
        <InputNumber v-model="amount" placeholder="0.00" mode="decimal" class="w-full border-gray-300 rounded-lg" />
        <div v-if="errors.amount" class="text-red-600 text-sm">
          <div v-for="(e, i) in errors.amount" :key="i">{{ e }}</div>
        </div>

        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="pi pi-arrow-left" outlined @click="backToMatricule" />
          <Button label="Valider" icon="pi pi-check" class="p-button-success p-button-rounded" @click="submitDeposit" :loading="loading" />
        </div>
      </div>

      <!-- Step 3: Résumé -->
      <div v-else-if="step === 3" class="space-y-4">
        <div class="bg-green-50 dark:bg-green-800 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-100 mb-2">Résumé du dépôt</h3>
          <p><b>Matricule :</b> {{ matricule }}</p>
          <p><b>Montant :</b> {{ amount }} USD</p>
          <p><b>Référence :</b> {{ summary.reference }}</p>
          <p><b>Nouveau solde :</b> {{ summary.balance_after }} USD</p>
        </div>

        <div class="flex justify-start mt-4">
          <Button label="Nouveau dépôt" icon="pi pi-refresh" outlined @click="newDeposit" />
        </div>
      </div>

    </div>
  </div>
</div>
 
 
</template>
