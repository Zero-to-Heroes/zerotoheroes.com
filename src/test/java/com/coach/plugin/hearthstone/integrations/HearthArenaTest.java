package com.coach.plugin.hearthstone.integrations;

import com.coach.review.Review;
import org.junit.Ignore;
import org.junit.Test;

public class HearthArenaTest {

    @Test
    @Ignore
    public void testDraftParsing() throws Exception {
        HearthArena ha = new HearthArena();
        ha.integrateRemoteData("https://www.heartharena.com/arena-run/4lm90g", new Review());
    }
}
