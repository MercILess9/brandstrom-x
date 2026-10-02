
// bxLoader() now lives in system/system.js (shared across pages, loaded before this file)

// ── Auth Functions ──────────────────────────────────────────────────────────

async function handleLogin(email, password) {
    try {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ html: bxLoader('Authenticating...'), showConfirmButton: false, allowOutsideClick: false });
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        notify("Success", "Welcome back!", "success");

        setTimeout(() => {
            window.location.href = "/index.html";
        }, 1000);

    } catch (error) {
        console.error('Login Error:', error.message);
        notify("Failed", error.message, "error");
    }
}

async function handleSignup(email, password, metadata) {
    try {
        Swal.fire({ html: bxLoader('Creating Account...'), showConfirmButton: false, allowOutsideClick: false });

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/auth/login.html',
                data: metadata
            }
        });

        if (error) throw error;

        // Supabase returns user:null when email already exists but unconfirmed
        if (!data?.user) {
            Swal.fire("Failed", "This email may already be registered or unconfirmed. Please sign in or contact admin.", "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Registration Complete!",
            text: "Please check your email for confirmation."
        }).then(() => {
            window.location.href = "login.html";
        });

    } catch (err) {
        console.error('Signup error:', err);
        const msg = (err.message || '').toLowerCase();
        let friendly;
        if (msg.includes('already registered') || msg.includes('already been registered')) {
            friendly = 'This email is already registered. Please sign in instead.';
        } else if (msg.includes('currently closed')) {
            friendly = 'Signups are currently closed. Please contact your administrator.';
        } else if (msg.includes('not allowed to register')) {
            friendly = 'Your email domain is not allowed to register. Please contact your administrator.';
        } else if (msg.includes('database error') || msg.includes('unexpected_failure') || !msg || msg === '{}') {
            friendly = 'Registration failed — Employee ID or codename may already be taken. Please contact admin.';
        } else {
            friendly = err.message;
        }
        Swal.fire("Failed", friendly, "error");
    }
}


async function handleForgotPassword(email) {
    try {
        Swal.fire({ html: bxLoader('Processing...'), showConfirmButton: false, allowOutsideClick: false });

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth/reset-password.html',
        });

        if (error) throw error;

        Swal.fire({
            icon: "success",
            title: "Link Sent!",
            text: "Please check your email to reset password.",
            confirmButtonColor: "rgb(45, 71, 57)"
        });

    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}

async function handleUpdatePassword(newPassword) {
    try {
        Swal.fire({ html: bxLoader('Updating...'), showConfirmButton: false, allowOutsideClick: false });

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        Swal.fire("Success!", "Password updated successfully.", "success").then(() => {
            window.location.href = "login.html";
        });

    } catch (err) {
        const msg = err.message?.toLowerCase() || '';
        const friendly = msg.includes('same password') || msg.includes('different from') || msg.includes('different password')
            ? 'New password must be different from your current password.'
            : err.message;
        Swal.fire("Error", friendly, "error");
    }
}
