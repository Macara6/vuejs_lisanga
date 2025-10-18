<script setup>
import { ref, reactive, computed } from 'vue';
import { fetchUser, repayCredit, fetchUserCredit } from '@/service/Api';

const step = ref(1);
const matricule = ref('');
const targetUser = reactive({});
const creditList = ref([]);
const selectedCredit = ref(null); // on stocke uniquement l'ID
const amount = ref(0);
const errors = reactive({});
const summary = reactive({});
const loading = ref(false);

// Computed pour récupérer l'objet complet du crédit sélectionné
const selectedCreditObj = computed(() => 
    creditList.value.find(c => c.id === selectedCredit.value)
);

async function nextFromMatricule() {
    errors.matricule = null;
    if(!matricule.value){
        errors.matricule = ['Le matricule est requis.'];
        return;
    }
    try {
        const users = await fetchUser();
        const user = users.find(u => u.matricule === matricule.value);
        if(!user){
            errors.matricule = ['Utilisateur non trouvé'];
            return;
        }
        Object.assign(targetUser, user);

        // Récupérer uniquement les crédits non payés
        const allCredits = await fetchUserCredit(user.id);
        creditList.value = allCredits.filter(c => !c.is_paid);

        step.value = 2;
    } catch(error) {
        errors.matricule = ['Erreur lors de la récupération de l’utilisateur.'];
        console.error(error);
    }
}

function backToMatricule(){
    step.value = 1;
}

async function submitRepayment() {
    errors.amount = null;
    if(!selectedCredit.value){
        errors.amount = ['Veuillez sélectionner un crédit.'];
        return;
    }
    loading.value = true;
    try {
        const repayData = {
            credit_id: selectedCredit.value,
            amount: amount.value
        };
        console.log("repayData", repayData);
        const res = await repayCredit(repayData);

        if (res.error) {
            if (res.data) {
                const firstKey = Object.keys(res.data)[0];
                errors.amount = res.data[firstKey];  
            } else {
                errors.amount = [res.message || "Erreur inconnue"];
            }
            loading.value = false;
            return;
        }

        // Mettre à jour le solde du crédit sélectionné
        const creditObj = creditList.value.find(c => c.id === selectedCredit.value);
        if (creditObj) creditObj.balance_due = res.balance_due;

        Object.assign(summary, res);
        step.value = 3;

    } catch(error) {
        errors.amount = ['Erreur lors du remboursement.'];
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function newRepayment() {
    step.value = 1;
    matricule.value = '';
    amount.value = 0;
    selectedCredit.value = null;
    Object.keys(targetUser).forEach(key => delete targetUser[key]);
    Object.keys(summary).forEach(key => delete summary[key]);
    creditList.value = [];
}
</script>


<template>
<div class="flex justify-center items-start min-h-screen bg-gray-100 py-12">
  <div class="w-full md:w-3/4 lg:w-2/3">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">

      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">💰 Remboursement</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Visualisez le compte avant le remboursement</p>
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

      <!-- Step 2: Détails du crédit -->
      <div v-else-if="step === 2" class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Détails du compte</h3>
          <p><b>Nom :</b> {{ targetUser.first_name }} {{ targetUser.last_name }}</p>
          <p><b>Username :</b> {{ targetUser.username }}</p>
          <p><b>Email :</b> {{ targetUser.email }}</p>
          <p><b>Solde actuel :</b> {{ targetUser.balance }} USD</p>
        </div>

        <h3>Crédits de {{ targetUser.first_name }} :</h3>
        <ul>
        <li v-for="credit in creditList" :key="credit.id" class="mb-2">
            <label class="flex items-center space-x-2">
            <!-- v-model.number pour forcer la conversion en nombre -->
            <input 
                type="radio" 
                :value="credit.id"  
                v-model.number="selectedCredit" 
                class="form-radio"
            />
            <span>
                Crédit : {{ credit.princilal }} USD, 
                Total à rembourser : {{ credit.total_due }} USD, 
                Solde restant : {{ credit.balance_due }} USD
            </span>
            </label>
        </li>
        </ul>

        <label class="font-medium text-gray-700 dark:text-gray-200 mt-4">Montant du remboursement</label>
        <InputNumber v-model="amount" placeholder="0.00" mode="decimal" class="w-full border-gray-300 rounded-lg" />

        <div v-if="errors.amount" class="text-red-600 text-sm">
          <div v-for="(e, i) in errors.amount" :key="i">{{ e }}</div>
        </div>

        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="pi pi-arrow-left" outlined @click="backToMatricule" />
          <Button label="Valider" icon="pi pi-check" class="p-button-success p-button-rounded" @click="submitRepayment" :loading="loading" />
        </div>
      </div>

      <!-- Step 3: Résumé -->
      <div v-else-if="step === 3" class="space-y-4">
        <div class="bg-green-50 dark:bg-green-800 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-100 mb-2">Résumé du remboursement</h3>
          <p><b>Matricule :</b> {{ matricule }}</p>
          <p><b>Montant remboursé :</b> {{ amount }} USD</p>
          <p><b>Crédit total :</b> {{ selectedCreditObj?.princilal }} USD</p>
          <p><b>Solde restant :</b> {{ summary.balance_due }} USD</p>
          <p><b>Date limite :</b> {{ selectedCreditObj?.due_date }}</p>
        </div>

        <div class="flex justify-start mt-4">
          <Button label="Nouveau remboursement" icon="pi pi-refresh" outlined @click="newRepayment" />
        </div>
      </div>

    </div>
  </div>
</div>
</template>
