package com.campusquest.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CampusQuestDiscoveryPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
