// template-app/android/app/src/main/java/com/example/app/SplashActivity.java

package com.example.app; // This line should be at the very top, ONLY ONCE.

// All import statements should follow the package declaration, ONLY ONCE.
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.graphics.Color;
import android.view.WindowManager;
import androidx.appcompat.app.AppCompatActivity;
import android.widget.ImageView;
import android.widget.TextView;
import android.view.Gravity;
import android.view.ViewGroup.LayoutParams;
import android.widget.LinearLayout;
import android.util.TypedValue;
import android.util.Log; // Ensure Log import is present if you use Log.e

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set fullscreen if requested
        if ({{FULLSCREEN}}) {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                 WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        // Set up layout
        LinearLayout splashLayout = new LinearLayout(this);
        splashLayout.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        splashLayout.setOrientation(LinearLayout.VERTICAL);
        splashLayout.setGravity(Gravity.CENTER);

        // Set background color safely
        try {
            splashLayout.setBackgroundColor(Color.parseColor("{{SPLASH_BACKGROUND_COLOR}}"));
        } catch (IllegalArgumentException e) {
            splashLayout.setBackgroundColor(Color.BLACK); // fallback
            Log.e("SplashActivity", "Invalid SPLASH_BACKGROUND_COLOR, using fallback.");
        }

        String splashType = "{{SPLASH_TYPE}}";  // "image" or "text"
        if ("image".equalsIgnoreCase(splashType)) {
            String splashContentName = "{{SPLASH_CONTENT}}";  // e.g., "splash.png"

            if (splashContentName != null && !splashContentName.isEmpty()) {
                String drawableName;

                if (splashContentName.contains(".")) {
                    try {
                        drawableName = splashContentName.substring(0, splashContentName.lastIndexOf('.'));
                    } catch (StringIndexOutOfBoundsException e) {
                        drawableName = splashContentName; // fallback
                        Log.e("SplashActivity", "Failed to extract drawable name from " + splashContentName);
                    }
                } else {
                    drawableName = splashContentName;
                }

                int imageResId = getResources().getIdentifier(drawableName, "drawable", getPackageName());

                if (imageResId != 0) {
                    ImageView imageView = new ImageView(this);
                    imageView.setImageResource(imageResId);
                    imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);

                    LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                    );
                    imgParams.setMargins(0, 0, 0, (int) TypedValue.applyDimension(
                            TypedValue.COMPLEX_UNIT_DIP, 20, getResources().getDisplayMetrics()));
                    imageView.setLayoutParams(imgParams);
                    splashLayout.addView(imageView);
                } else {
                    addErrorText(splashLayout, "Splash image not found: " + drawableName);
                }
            } else {
                addErrorText(splashLayout, "Splash content name not set.");
            }
        } else {
            // Default to text splash
            TextView appNameText = new TextView(this);
            appNameText.setText("{{APP_NAME}}");

            try {
                appNameText.setTextColor(Color.parseColor("{{SPLASH_TEXT_COLOR}}"));
            } catch (IllegalArgumentException e) {
                appNameText.setTextColor(Color.WHITE);
                Log.e("SplashActivity", "Invalid SPLASH_TEXT_COLOR, using white.");
            }

            appNameText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 36);
            appNameText.setGravity(Gravity.CENTER);
            splashLayout.addView(appNameText);
        }

        // Set the view
        setContentView(splashLayout);

        // Start MainActivity after delay
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            }
        }, {{SPLASH_DURATION}});
    }

    // Helper function for fallback error messages
    private void addErrorText(LinearLayout layout, String message) {
        TextView errorText = new TextView(this);
        errorText.setText(message);
        errorText.setTextColor(Color.RED);
        errorText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        errorText.setGravity(Gravity.CENTER);
        layout.addView(errorText);
    }
}