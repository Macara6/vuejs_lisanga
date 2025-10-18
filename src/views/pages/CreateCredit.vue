
<script setup>
import { ref, reactive } from 'vue';
import { fetchUser, createCredit } from '@/service/Api';
import { useToast } from "primevue/usetoast";

const step = ref(1);
const matricule = ref('');
const targetUser = reactive({});
const amount = ref(0);
const interest_rate = ref(10); // 10% par défaut
const due_date = ref(null);
const errors = reactive({});
const summary = reactive({});
const loading = ref(false);
const toast = useToast();





async function nextFromMatricule(){
    errors.matricule = null;
    if(!matricule.value){
        errors.matricule =['le matricule est requis.'];
        return;
    }
    try{
        const users = await fetchUser();
        const user = users.find(u => u.matricule === matricule.value);
        if(!user){
            errors.matricule =['Utilisateur non trouvé'];
            return;
        }
        Object.assign(targetUser,user);
        step.value = 2;
    } catch(error){
        errors.matricule = ['Erreur lors de la récupération de l’utilisateur.'];
    }
}
function backToMatricule(){
    step.value=1;

}
async function submitCredit(){
    errors.amount = null;
    if(amount.value <=0 ){
        errors.amount.value = ['le montant doit être supérieur à 0.'];
        return; 
    }
    const finalDueDate = due_date.value
            ? new Date(due_date.value).toISOString().split('T')[0]
            :null;
    loading.value = true;
    try{
        const creditData = {
            matricule: matricule.value,
            princilal: amount.value,
            interest_rate: interest_rate.value,
            due_date: finalDueDate,
        };
        const res = await createCredit(creditData);
        toast.add({ severity: "success", summary: "Succès", detail: "demande crédit effectué avec succès !" });
        if(res.error){
            errors.amount = [res.message || JSON.stringify(res.data)];
            loading.value = false;
            return;
        }
         Object.assign(summary, res);
         step.value=3;
    }catch(error){
        errors.amount = ['Erreur lors de la création du crédit.'];
        console.error(err);
    } finally{
         loading.value = false;
    }
}

function newCredit(){
    step.value = 1;
    matricule.value = '';
    amount.value = 0;
    interest_rate.value = 0.10;
    due_date.value = null;
    Object.keys(targetUser).forEach(key => delete targetUser[key]);
    Object.keys(summary).forEach(key => delete summary[key]);
}



</script>

  
<template>
<div class="flex justify-center items-start min-h-screen bg-gray-100 py-12">
  <div class="w-full md:w-3/4 lg:w-2/3">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">💰 Demande de crédit</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Visualisez le compte avant de créer le crédit</p>
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

        <label class="font-medium text-gray-700 dark:text-gray-200 mt-4">Montant du crédit</label>
        <InputNumber v-model="amount" placeholder="0.00" mode="decimal" class="w-full border-gray-300 rounded-lg" />
        <div v-if="errors.amount" class="text-red-600 text-sm">
          <div v-for="(e, i) in errors.amount" :key="i">{{ e }}</div>
        </div>

        <label class="font-medium text-gray-700 dark:text-gray-200">Date d’échéance (facultative)</label>
        <Calendar v-model="due_date" showIcon dateFormat="yy-mm-dd" placeholder="Choisissez une date" class="w-full border-gray-300 rounded-lg" />


        <div class="flex justify-between mt-6">
          <Button label="Retour" icon="pi pi-arrow-left" outlined @click="backToMatricule" />
          <Button label="Valider" icon="pi pi-check" class="p-button-success p-button-rounded" @click="submitCredit" :loading="loading" />
        </div>
      </div>

      <!-- Step 3: Résumé -->
      <div v-else-if="step === 3" class="space-y-4">
        <div class="bg-green-50 dark:bg-green-800 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-100 mb-2">Résumé du crédit</h3>
          <p><b>Matricule :</b> {{ matricule }}</p>
          <p><b>Montant :</b> {{ amount }} USD</p>
          <p><b>Intérêt :</b> {{ interest_rate }}%</p>
          <p><b>Total à rembourser :</b> {{ summary.total_due }} USD</p>
          <p><b>Date limite :</b> {{ summary.due_date }}</p>
        </div>

        <div class="flex justify-start mt-4">
          <Button label="Nouveau crédit" icon="pi pi-refresh" outlined @click="newCredit" />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

