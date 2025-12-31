// Firebase Configuration - Use your actual config
const firebaseConfig = {
    apiKey: "AIzaSyDH4EYuAo4ZJuWSqEoKzS0tANNNFW6vSL8",
    authDomain: "foodconnect-app.firebaseapp.com",
    projectId: "foodconnect-app",
    storageBucket: "foodconnect-app.firebasestorage.app",
    messagingSenderId: "410372973417",
    appId: "1:410372973417:web:d264ea3d887d34faa013f8",
    measurementId: "G-TPMWY6YYZ1"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const db = firebase.firestore();

// Food Posts Collection - MAKE IT GLOBAL
const foodPostsCollection = db.collection('foodPosts');

// DEMO DATA - Add some sample food posts for testing
async function initializeDemoData() {
    try {
        const snapshot = await foodPostsCollection.limit(1).get();
        if (snapshot.empty) {
            console.log('📦 Adding demo data to Firebase...');
            const demoPosts = [
                {
                    title: "Fresh Pizza Margherita",
                    description: "8 large pizzas from office event, completely untouched and freshly made",
                    quantity: "8",
                    quantityUnit: "pizzas",
                    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                    location: "Downtown Office Tower",
                    donorName: "TechCorp Inc",
                    donorPhone: "+1 (555) 123-4567",
                    donorEmail: "events@techcorp.com",
                    timestamp: new Date().toISOString(),
                    status: "available",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add this
                },
                {
                    title: "Assorted Sandwiches & Salads",
                    description: "Fresh sandwiches, wraps, and garden salads from cancelled meeting",
                    quantity: "25",
                    quantityUnit: "servings",
                    expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                    location: "City Convention Center",
                    donorName: "Sarah Johnson",
                    donorPhone: "+1 (555) 987-6543",
                    timestamp: new Date().toISOString(),
                    status: "available",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add this
                },
                {
                    title: "Fresh Fruit Platters",
                    description: "Seasonal fruit platters with melons, berries, and tropical fruits",
                    quantity: "15",
                    quantityUnit: "platters",
                    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    location: "Westside Community Hall",
                    donorName: "Fresh Market Co",
                    donorPhone: "+1 (555) 456-7890",
                    donorEmail: "donations@freshmarket.com",
                    timestamp: new Date().toISOString(),
                    status: "available",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add this
                }
            ];

            for (const post of demoPosts) {
                await foodPostsCollection.add(post);
            }
            console.log('✅ Demo data initialized');
        } else {
            console.log('📊 Demo data already exists');
        }
    } catch (error) {
        console.log('Demo data already exists or error:', error);
    }
}

// Initialize demo data when the app loads
initializeDemoData();

// Add new food post - FIXED to include createdAt
async function addFoodPost(foodData) {
    try {
        const docRef = await foodPostsCollection.add({
            ...foodData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // This ensures createdAt exists
        });
        console.log('✅ Food post added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding food post:', error);
        throw error;
    }
}

// Get all food posts - FIXED query to handle missing createdAt
async function getFoodPosts() {
    try {
        // First try to get posts with createdAt (new posts)
        let snapshot = await foodPostsCollection
            .where('status', '==', 'available')
            .orderBy('createdAt', 'desc')
            .get();
        
        let posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('📥 Loaded food posts with createdAt:', posts.length);
        
        // If no posts with createdAt, try without ordering
        if (posts.length === 0) {
            console.log('🔄 No posts with createdAt, loading all posts...');
            snapshot = await foodPostsCollection
                .where('status', '==', 'available')
                .get();
            
            posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort by timestamp manually if no createdAt
            posts.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toDate().getTime() : new Date(a.timestamp).getTime();
                const timeB = b.createdAt ? b.createdAt.toDate().getTime() : new Date(b.timestamp).getTime();
                return timeB - timeA; // Descending order
            });
        }
        
        console.log('✅ Total loaded posts:', posts.length);
        return posts;
    } catch (error) {
        console.error('❌ Error getting food posts:', error);
        
        // Fallback: try without ordering
        try {
            const snapshot = await foodPostsCollection
                .where('status', '==', 'available')
                .get();
            
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort by timestamp manually
            posts.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toDate().getTime() : new Date(a.timestamp).getTime();
                const timeB = b.createdAt ? b.createdAt.toDate().getTime() : new Date(b.timestamp).getTime();
                return timeB - timeA;
            });
            
            console.log('📥 Fallback loaded posts:', posts.length);
            return posts;
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            return [];
        }
    }
}

// Real-time listener for food posts - FIXED to handle missing createdAt
function setupFoodPostsListener(callback) {
    console.log('🔔 Setting up real-time listener...');
    
    try {
        return foodPostsCollection
            .where('status', '==', 'available')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('🔄 Real-time update received:', posts.length, 'posts');
                callback(posts);
            }, error => {
                console.log('🔄 Real-time with createdAt failed, trying without order...');
                // Fallback without ordering
                return foodPostsCollection
                    .where('status', '==', 'available')
                    .onSnapshot(snapshot => {
                        const posts = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        // Sort manually
                        posts.sort((a, b) => {
                            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : new Date(a.timestamp).getTime();
                            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : new Date(b.timestamp).getTime();
                            return timeB - timeA;
                        });
                        console.log('🔄 Real-time fallback update:', posts.length, 'posts');
                        callback(posts);
                    }, error => {
                        console.error('❌ Error in food posts listener:', error);
                    });
            });
    } catch (error) {
        console.error('❌ Error setting up real-time listener:', error);
    }
}

// Update food post status (mark as claimed)
async function updateFoodPostStatus(postId, status) {
    try {
        await foodPostsCollection.doc(postId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Food post status updated');
    } catch (error) {
        console.error('❌ Error updating food post:', error);
        throw error;
    }
}