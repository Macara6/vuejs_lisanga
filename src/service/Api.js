
import axios from "axios";


const API_BASE = 'https://api.lisanga.org/';



export async function login(usernam, password){
    const LOGIN_URL = `${API_BASE}login/`;

    try{
        const response = await axios.post(LOGIN_URL, {
            username:usernam,
            password:password,
        });
        const {id, username, email, token, refresh, is_superuser} = response.data;
        
        
        localStorage.setItem('token',token);
        localStorage.setItem('refresh_token',refresh);
        localStorage.setItem('id',id);
        localStorage.setItem('username', usernam);
        localStorage.setItem('email', email);
        localStorage.setItem('is_superuser',is_superuser);
         console.log('token:',token, 'id', id,'username',usernam,'email',email);
        return {id, username,email, token, is_superuser }

    } catch(error){
        console.error('Error logging in:', error);
        throw error;
    }
}

function getAuthHeaders(){
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json",
    }
}

// fonction poour l'utlisateur
export async function userCreate(userCreateData){
    const CREATE_USER = `${API_BASE}user/create/`;
    try{
        const response = await axios.post(CREATE_USER, userCreateData, {
            headers:getAuthHeaders(),
        });
        console.log('User data', response.data);
        return response.data;
    }catch(error){
        if(error.response){
            return {
                error: true,
                status: error.response.status,
                data: error.response.data
              };
        } else{
            return {
                error: true,
                message: 'Une erreur s’est produite lors de la création de l’utilisateur.'
              };
        }
    }
}

export async function fetchUser(){
    const USER_LISTE = `${API_BASE}user/liste/`;
    try{
        const response = await axios.get(USER_LISTE, {
            headers:getAuthHeaders(),
        });
        return response.data
    }catch(error){
        console.error('error for fetching users', error);
        throw error;
    }
}
export async function userDetail(userID){
    const URL_USER_DETAIL =`${API_BASE}user/detail/${userID}`;
    try{
        const response = await axios.get(URL_USER_DETAIL, {
            headers: getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('error feching detail user', error);
        throw error;
    }
}
// function pour update de l'utilisateur 
export async function updateUser(userId, userUpdateData){
    const UPDATE_USER_URL = `${API_BASE}UpdateUser/${userId}/`;
    try{
        const response = await axios.put(UPDATE_USER_URL,userUpdateData,{
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error("Erreur backend:", error.response?.data);
        throw error;
    }
}
// function to change password
export async function changeUserPassword(data){
    const CHANGE_PASSWORD_URL = `${API_BASE}change-password/`;
    try{
        const response = await axios.post(CHANGE_PASSWORD_URL, data, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error("Erreur backend :", error.response?.data);
        throw error;
    }
}
// debut fonctions pour le suppléants 
export async function createSbstitute(substituteData){
    const CREATE_SUBSTITUTE = `${API_BASE}substituteCreate/`;
    try{
        const response = await axios.post(CREATE_SUBSTITUTE, substituteData, {
            headers : getAuthHeaders(),
        });
        return response.data;
    } catch (error){
         console.error('Error creating substitute', error);
         throw error;
    }
}

export async function fetchSubstitute(){
    const FETCH_URL =`${API_BASE}ListeSubstitute/`;
    try{
        const response = await axios.get(FETCH_URL, {
            headers : getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('errer fetching substitute:',error);
        throw error; 
    }
}

export async function updateSubstitute(subdstituteId, updatedData){
    const UPDATE_SUBSTITUTE_URL = `${API_BASE}substituteUpdate/${subdstituteId}/`;
    try{
        const response = await axios.put(UPDATE_SUBSTITUTE_URL, updatedData , {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch(error){
        console.error('Error updating substitute', error);
        throw error;
    }
}


// fon
export async function deleteSubstitute(substituteId){
    const DELETE_SUBSTITUTE = `${API_BASE}subdstitute/delete/${substituteId}/`;
    try {
        const response = await axios.delete(DELETE_SUBSTITUTE, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data
    }catch(error){
        console.log('error to deleteting substitute');
        throw error;
    }
}
// fin des fonctions pour le suppléant
export async function adminDeposit(matricule, amount){
    const ADMIN_DEPOSIT_URL =`${API_BASE}adminDeposit/`;
    try{
        const response = await axios.post(ADMIN_DEPOSIT_URL, {matricule,amount}, {
            headers:getAuthHeaders(),
        });
        console.log('admin deposit successfull', response.data);
        return response.data
    }catch(error){
        console.error('error making admin deposit:', error);
        throw error;
    }
}
export async function adminDepositSocial(matricule, amount){
    const ADMIN_DEPOSIT_SOCIAL = `${API_BASE}adminDepositSocial/`;
    try{
        const response = await axios.post(ADMIN_DEPOSIT_SOCIAL,{matricule, amount}, {
            headers : getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('Erreur lors du depôt social', error);
        throw error;
    }
}

export async function adminWithdraw(matricule, amount){
    const ADMIN_WITHDRAW_URL = `${API_BASE}adminWithdraw/`;
    try{
        const response = await axios.post(ADMIN_WITHDRAW_URL,{matricule, amount}, {
            headers:getAuthHeaders(),
        });
        console.log('Admin withdraw successful', response.data);
        return response.data;   
    }catch(error){
        console.error('error making admin withdraw:', error);
        throw error;
    }
}
// fin des fonctions 
// fonction pour envoie l'argent 
export async function sendMoney(matricule, amount){
    const SEND_MONEY_URL = `${API_BASE}sendMoney/`;
    try{
        const response = await axios.post(SEND_MONEY_URL, {matricule,amount},{
            headers:getAuthHeaders(),
        });
        console.log("envoie d'argent réussi", response.data);
        return response.data
    } catch(error){
        console.error("erruer lors de l'envoi de l'argent", error);
        throw error;
    }
}

// function fetching for transaction userID 
export async function fetchTransactionOrUser(userId){
    const TRASANCTION_LISTE_USER =`${API_BASE}userTransaction/${userId}/`;
    try{
        const response = await axios.get(TRASANCTION_LISTE_USER, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.log('Error fetching transaction', error);
        throw error;
    }
}
// historique des transaction
export async function fetchHistoriqueTransaction(){
    const TRANSACTION_HISTORIQUE_URL = `${API_BASE}transactionList/`;
    try{
        const response = await axios.get(TRANSACTION_HISTORIQUE_URL, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
      console.error('errror fetching transaction historiques', error);
      throw error;
    }
}
// fonction pour annuler la tansaction
export async function cancelTransaction(transacationId){
    const CANCEL_TRANSACTION_URL =`${API_BASE}transations/cancel/${transacationId}/`;
    try{
        const response = await axios.post(CANCEL_TRANSACTION_URL,{},{
            headers:getAuthHeaders(),
        });
        console.log("Transaction annulée avec succès :", response.data);
        return response.data;
    }catch(error){
         console.error("Erreur lors de l'annulation de la transaction :", error);
         throw error;
    }
}
// annulatation du credit et remboursement
export async function cancelCreditTransaction(CreditTransactionId){
    const CANCEL_CREDIT_TRANSACTION =`${API_BASE}CreditTransaction/cancel/${CreditTransactionId}/`;
    try{
        const response = await axios.post(CANCEL_CREDIT_TRANSACTION,{},{
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.log("error lors de l'annulation de la transaction", error);
        throw error;   
    }
}
// création du crédit
export async function createCredit(creditData){
    const CREATE_CREDIT_URL =`${API_BASE}credits/create/`;
    try{
        const response = await axios.post(CREATE_CREDIT_URL, creditData ,{
            headers:getAuthHeaders(),
        });
        return response.data;

    }catch(error){
      if(error.response){
        console.error("Erreur API Credit:", error.response.data); 
        return {
            error:error,
            status:error.response.status,
            ata: error.response.data,
        };
      }else{
        return {
            error:true,
            message: 'Une erreur s’est produite lors de la création du crédit.',
        };
      }
    }
}
// remboursement
export async function repayCredit(repayData) {
    const REPAY_CREDIT_URL = `${API_BASE}creditsRepay/`;
    try {
        const response = await axios.post(REPAY_CREDIT_URL, repayData, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Erreur API Remboursement:", error.response.data);
            return {
                error: true,
                status: error.response.status,
                data: error.response.data,
            };
        } else {
            return {
                error: true,
                message: "Une erreur s’est produite lors du remboursement du crédit.",
            };
        }
    }
}

// affichage crédit pour utilisateur 
export async function fetchUserCredit(userCreditId){
    const CREDIT_USER_URL = `${API_BASE}userCredit/${userCreditId}/`;
    try{
        const response = await axios.get(CREDIT_USER_URL, {
            headers:getAuthHeaders(),
        });
        return response.data;   
    }catch(error){
        console.error('erreur lors de la recuperation du credit utilisateur',error);
        throw error;
    }
}
// recuperer toutes les transaction credits et remboursements
export async function fetchAllTransactionCredit(){
    const TRANASCTION_ALL_CREDITS_REMBOUR =`${API_BASE}ListeTrasCreditRemboursement/`;
    try{
        const response = await axios.get(TRANASCTION_ALL_CREDITS_REMBOUR, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('erreur lors de la recuperation des transaction', error);
        throw error;
    }
}

export async function fetchAllCredit(){
    const CREDITS_ALL_URL =`${API_BASE}ListCredit/`;
    try{
        const response = await axios.get(CREDITS_ALL_URL, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('erreur lors de la recuperation du credit utilisateur',error);
        throw error;
    }
}

// function pour la creation de bon de sortie 
export async function createCashoutAPI(cashouData){
    const CASHOUT_CREATE = `${API_BASE}cashout/create/`;
    try{
        const response = await axios.post(CASHOUT_CREATE,cashouData,{
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('Error creating CashOut:', error.response?.data || error);
        throw error;
    }
}
export async function fetchCashout(){
    const URL_FETCH_CASHOUT = `${API_BASE}cashout/liste/`;
    try{
        const response = await axios.get(URL_FETCH_CASHOUT, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('erreur to fetching Cashout', error);
        throw error;
    }
}

export async function fechCashoutDetail(cashoutId){
    const URL_CASHOUT_DETAIL = `${API_BASE}cashoutDetail/?cashout=${cashoutId}`;
    try{
        const response = await axios.get(URL_CASHOUT_DETAIL, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('erreur to feching cashout detail', error);
        throw error;
    }
}

export async function deleteCashout(cashoutId){
    const URL_DELETE_CASH = `${API_BASE}cashoutDelete/${cashoutId}/`;
    try{
        const response = await axios.delete(URL_DELETE_CASH, {
            headers:getAuthHeaders(),
        });
        return response.data;
    }catch(error){
        console.error('Error deleting CashOut:', error.response?.data || error);
        throw error;
    }
}
// function pour le cycle 
export async function fetchCycle(){
    const FETCH_CYCLE_URL = `${API_BASE}cycles/`;
    try{
        const response = await axios.get(FETCH_CYCLE_URL, {
            headers:getAuthHeaders(),
        });
        console.log('lestes cycle', response.data);
        return response.data;
    }catch(error){
        console.error('erreur lors de la recuperation des cycles', error);
        throw error;
    }
}
export async function updateCycle(cycleId, cycleData){
    const UPDATE_CYCLE_URL =`${API_BASE}cycleUpdate/${cycleId}/`;
    try{
        const response = await  axios.put(UPDATE_CYCLE_URL, cycleData, {
            headers:getAuthHeaders(),
        });
        console.log('date update',cycleData.value)
        return response.data;
    }catch(error){
        console.error('erreur lors de mise a jour', error);
        throw error;
    }
}

// Envoie du code de réinitialisation 
export async function requestPasswordReset(email){
    const REQUEST_RESET_URL = `${API_BASE}passwordRequest/`;
    try{
        const response =await axios.post(REQUEST_RESET_URL,{email});
        return response.data;
    }catch(error){
        console.error("Erreur lors de la demande de réinitialisation :", error.response?.data);
        throw error;
    }
}
// cconfirmation avec le code et nouveau mot de passe
export async function confirmPasswordReset(data){
    const CONFIRM_RESET_URL = `${API_BASE}password-reset-confirm/`;
    try{
        const response = await axios.post(CONFIRM_RESET_URL,data);
        return response.data
    }catch(error){
       console.error("Erreur lors de la confirmation de réinitialisation :", error.response?.data);
       throw error
    }
}